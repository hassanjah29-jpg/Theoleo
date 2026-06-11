/* HAND — shared helpers for Cloudflare Pages Functions.
   Files starting with "_" are not routed; this is import-only. */

const enc = new TextEncoder();

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: Object.assign({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }, headers)
  });
}

export function timingSafeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const SESSION_DAYS = 30;

export async function createSessionCookie(env, user) {
  const expires = Date.now() + SESSION_DAYS * 24 * 3600 * 1000;
  const sig = await hmacHex(env.SESSION_SECRET, user + "." + expires);
  const token = user + "." + expires + "." + sig;
  return "hand_session=" + token +
    "; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=" + (SESSION_DAYS * 24 * 3600);
}

export async function verifySession(env, request) {
  if (!env.SESSION_SECRET) return null;
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(/(?:^|;\s*)hand_session=([^;\s]+)/);
  if (!m) return null;
  const parts = m[1].split(".");
  if (parts.length !== 3) return null;
  const [user, expires, sig] = parts;
  if (!/^\d+$/.test(expires) || Date.now() > Number(expires)) return null;
  const expected = await hmacHex(env.SESSION_SECRET, user + "." + expires);
  return timingSafeEqual(sig, expected) ? user : null;
}

/* Saved content from KV, falling back to the bundled content.json */
export async function getContent(env, origin) {
  if (env.CONTENT_KV) {
    try {
      const kv = await env.CONTENT_KV.get("content", "json");
      if (kv) return kv;
    } catch (e) { /* fall through to bundled default */ }
  }
  try {
    const res = await env.ASSETS.fetch(new URL("/content.json", origin));
    if (res.ok) return await res.json();
  } catch (e) { /* no default available */ }
  return null;
}
