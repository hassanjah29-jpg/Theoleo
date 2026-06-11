/* /api/content — GET: current content (KV, falling back to the
   bundled content.json). PUT: save edits to KV (auth required;
   previous version kept at "content:backup"). */

import { json, verifySession, getContent } from "../_utils.js";

export async function onRequestGet({ request, env }) {
  const content = await getContent(env, new URL(request.url).origin);
  return json(content || {});
}

export async function onRequestPut({ request, env }) {
  const user = await verifySession(env, request);
  if (!user) return json({ error: "Sign in first." }, 401);

  if (!env.CONTENT_KV) {
    return json({
      error: "KV not connected. In Cloudflare Pages → Settings → Functions → KV namespace bindings, add a binding named CONTENT_KV, then redeploy."
    }, 500);
  }

  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "Invalid JSON" }, 400); }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return json({ error: "Content must be an object" }, 400);
  }

  const previous = await env.CONTENT_KV.get("content");
  if (previous) await env.CONTENT_KV.put("content:backup", previous);
  await env.CONTENT_KV.put("content", JSON.stringify(body));

  return json({ ok: true, savedBy: user, at: new Date().toISOString() });
}
