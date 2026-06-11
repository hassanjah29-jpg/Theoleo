/* HAND — Pages middleware.
   1. Blocks the Node-only files so they're never served publicly.
   2. Injects the saved content (KV, falling back to bundled
      content.json) plus the cms.js hydration script into every
      HTML page — the Cloudflare equivalent of server.js. */

import { getContent } from "./_utils.js";

const BLOCKED = ["/auth.json", "/server.js", "/content.json.backup"];

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (BLOCKED.includes(url.pathname)) {
    return new Response("Not found", { status: 404 });
  }

  const response = await next();
  const type = response.headers.get("Content-Type") || "";
  if (!type.includes("text/html")) return response;

  const content = await getContent(env, url.origin);
  if (!content) return response;

  const payload = JSON.stringify(content).replace(/</g, "\\u003c");
  const tag =
    "<script>window.HAND_CONTENT=" + payload + ";</script>" +
    '<script src="/assets/js/cms.js"></script>';

  return new HTMLRewriter()
    .on("head", {
      element(el) { el.append(tag, { html: true }); }
    })
    .transform(response);
}
