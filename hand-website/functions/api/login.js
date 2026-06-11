/* POST /api/login — { password } → session cookie.
   Passwords live as encrypted environment variables in the Pages
   project (PASSWORD_OWNER / PASSWORD_PARTNER), never in the repo.
   Failed attempts are rate-limited per IP via KV (8 per 15 min). */

import { json, timingSafeEqual, createSessionCookie } from "../_utils.js";

const MAX_ATTEMPTS = 8;
const WINDOW_SECONDS = 900;

export async function onRequestPost({ request, env }) {
  if (!env.PASSWORD_OWNER || !env.PASSWORD_PARTNER || !env.SESSION_SECRET) {
    return json({
      error: "Server not configured. In Cloudflare Pages → Settings → Environment variables, add PASSWORD_OWNER, PASSWORD_PARTNER, and SESSION_SECRET, then redeploy."
    }, 500);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rlKey = "ratelimit:" + ip;

  if (env.CONTENT_KV) {
    const count = parseInt((await env.CONTENT_KV.get(rlKey)) || "0", 10);
    if (count >= MAX_ATTEMPTS) {
      return json({ error: "Too many attempts. Try again in 15 minutes." }, 429);
    }
  }

  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  const password = String(body.password || "");

  let user = null;
  if (timingSafeEqual(password, env.PASSWORD_OWNER)) user = "owner";
  else if (timingSafeEqual(password, env.PASSWORD_PARTNER)) user = "partner";

  if (!user) {
    if (env.CONTENT_KV) {
      const count = parseInt((await env.CONTENT_KV.get(rlKey)) || "0", 10);
      await env.CONTENT_KV.put(rlKey, String(count + 1), { expirationTtl: WINDOW_SECONDS });
    }
    return json({ error: "Wrong password." }, 401);
  }

  return json({ user }, 200, { "Set-Cookie": await createSessionCookie(env, user) });
}
