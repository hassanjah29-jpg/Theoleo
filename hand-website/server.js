#!/usr/bin/env node
/* HAND — content backend.
   Zero-dependency Node server: serves the static site, injects editable
   content from content.json into every page, and exposes a password-
   protected admin panel at /admin for editing everything.

   Run:              node server.js          (http://localhost:3000)
   Change password:  node server.js --set-password owner "NewPassword"
                     node server.js --set-password partner "NewPassword"
*/

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const CONTENT_FILE = path.join(ROOT, "content.json");
const AUTH_FILE = path.join(ROOT, "auth.json");
const SESSION_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days
const MAX_BODY = 2 * 1024 * 1024;

/* ---------------- auth helpers ---------------- */

function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, record) {
  if (!record || !record.salt || !record.hash) return false;
  const candidate = crypto.scryptSync(password, record.salt, 64);
  const stored = Buffer.from(record.hash, "hex");
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

function loadAuth() {
  return JSON.parse(fs.readFileSync(AUTH_FILE, "utf8"));
}

/* --set-password CLI */
const argv = process.argv.slice(2);
if (argv[0] === "--set-password") {
  const user = argv[1];
  const pass = argv[2];
  if (!user || !pass || ["owner", "partner"].indexOf(user) === -1) {
    console.error('Usage: node server.js --set-password <owner|partner> "NewPassword"');
    process.exit(1);
  }
  const auth = fs.existsSync(AUTH_FILE) ? loadAuth() : { users: {} };
  auth.users[user] = hashPassword(pass);
  fs.writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2));
  console.log("Password updated for '" + user + "'.");
  process.exit(0);
}

if (!fs.existsSync(AUTH_FILE)) {
  console.error("auth.json missing — create passwords first:");
  console.error('  node server.js --set-password owner "YourPassword"');
  process.exit(1);
}

/* ---------------- sessions & rate limiting ---------------- */

const sessions = new Map(); // token -> { user, expires }
const loginAttempts = new Map(); // ip -> { count, resetAt }

function getSession(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/(?:^|;\s*)hand_session=([a-f0-9]{64})/);
  if (!match) return null;
  const sess = sessions.get(match[1]);
  if (!sess) return null;
  if (Date.now() > sess.expires) { sessions.delete(match[1]); return null; }
  return { token: match[1], user: sess.user };
}

function rateLimited(ip) {
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (!rec || now > rec.resetAt) return false;
  return rec.count >= 8;
}

function recordAttempt(ip, success) {
  const now = Date.now();
  let rec = loginAttempts.get(ip);
  if (!rec || now > rec.resetAt) rec = { count: 0, resetAt: now + 15 * 60 * 1000 };
  rec.count = success ? 0 : rec.count + 1;
  loginAttempts.set(ip, rec);
}

/* ---------------- http helpers ---------------- */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".woff2": "font/woff2"
};

function send(res, code, body, headers) {
  res.writeHead(code, Object.assign({ "Cache-Control": "no-store" }, headers || {}));
  res.end(body);
}

function sendJSON(res, code, obj, headers) {
  send(res, code, JSON.stringify(obj), Object.assign({ "Content-Type": "application/json; charset=utf-8" }, headers || {}));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error("body too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function readContent() {
  return fs.readFileSync(CONTENT_FILE, "utf8");
}

function writeContent(json) {
  // keep one backup, write atomically
  if (fs.existsSync(CONTENT_FILE)) {
    fs.copyFileSync(CONTENT_FILE, CONTENT_FILE + ".backup");
  }
  const tmp = CONTENT_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(json, null, 2));
  fs.renameSync(tmp, CONTENT_FILE);
}

/* Inject content + hydration script into served HTML pages */
function injectContent(html) {
  let payload;
  try {
    payload = JSON.stringify(JSON.parse(readContent())).replace(/</g, "\\u003c");
  } catch (e) {
    return html; // bad content.json — serve baked defaults
  }
  const tag = "<script>window.HAND_CONTENT=" + payload + ";</script>" +
              '<script src="/assets/js/cms.js"></script>';
  return html.includes("</head>") ? html.replace("</head>", tag + "\n</head>") : tag + html;
}

/* ---------------- server ---------------- */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  const pathname = decodeURIComponent(url.pathname);
  const ip = req.socket.remoteAddress || "?";

  /* ---- API ---- */
  if (pathname === "/api/login" && req.method === "POST") {
    if (rateLimited(ip)) return sendJSON(res, 429, { error: "Too many attempts. Try again in 15 minutes." });
    let body;
    try { body = JSON.parse(await readBody(req)); } catch (e) { return sendJSON(res, 400, { error: "Bad request" }); }
    const auth = loadAuth();
    const user = Object.keys(auth.users).find((u) => verifyPassword(String(body.password || ""), auth.users[u]));
    recordAttempt(ip, !!user);
    if (!user) return sendJSON(res, 401, { error: "Wrong password." });
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, { user, expires: Date.now() + SESSION_TTL });
    return sendJSON(res, 200, { user }, {
      "Set-Cookie": "hand_session=" + token + "; HttpOnly; SameSite=Lax; Path=/; Max-Age=" + (SESSION_TTL / 1000)
    });
  }

  if (pathname === "/api/logout" && req.method === "POST") {
    const sess = getSession(req);
    if (sess) sessions.delete(sess.token);
    return sendJSON(res, 200, { ok: true }, { "Set-Cookie": "hand_session=; Path=/; Max-Age=0" });
  }

  if (pathname === "/api/session" && req.method === "GET") {
    const sess = getSession(req);
    return sess ? sendJSON(res, 200, { user: sess.user }) : sendJSON(res, 401, { error: "Not signed in" });
  }

  if (pathname === "/api/content") {
    if (req.method === "GET") {
      return send(res, 200, readContent(), { "Content-Type": "application/json; charset=utf-8" });
    }
    if (req.method === "PUT") {
      const sess = getSession(req);
      if (!sess) return sendJSON(res, 401, { error: "Sign in first." });
      let body;
      try { body = JSON.parse(await readBody(req)); } catch (e) { return sendJSON(res, 400, { error: "Invalid JSON" }); }
      if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return sendJSON(res, 400, { error: "Content must be an object" });
      }
      writeContent(body);
      return sendJSON(res, 200, { ok: true, savedBy: sess.user, at: new Date().toISOString() });
    }
  }

  /* ---- Admin panel ---- */
  if (pathname === "/admin" || pathname === "/admin/") {
    const html = fs.readFileSync(path.join(ROOT, "admin", "index.html"), "utf8");
    return send(res, 200, html, { "Content-Type": MIME[".html"] });
  }

  /* ---- Static site ---- */
  if (req.method !== "GET" && req.method !== "HEAD") return sendJSON(res, 405, { error: "Method not allowed" });

  let filePath = pathname === "/" ? "/index.html" : pathname;
  const resolved = path.normalize(path.join(ROOT, filePath));
  if (!resolved.startsWith(ROOT + path.sep) && resolved !== ROOT) return send(res, 403, "Forbidden");
  // never serve secrets
  const base = path.basename(resolved);
  if (base === "auth.json" || base === "server.js" || base.startsWith("content.json")) {
    return send(res, 404, "Not found");
  }

  fs.stat(resolved, (err, stat) => {
    if (err || !stat.isFile()) return send(res, 404, "Not found");
    const ext = path.extname(resolved).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    if (ext === ".html") {
      fs.readFile(resolved, "utf8", (e, html) => {
        if (e) return send(res, 500, "Server error");
        send(res, 200, injectContent(html), { "Content-Type": type });
      });
    } else {
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "public, max-age=300" });
      fs.createReadStream(resolved).pipe(res);
    }
  });
});

server.listen(PORT, () => {
  console.log("HAND site:   http://localhost:" + PORT);
  console.log("Admin panel: http://localhost:" + PORT + "/admin");
});
