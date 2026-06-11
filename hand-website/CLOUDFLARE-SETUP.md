# HAND on Cloudflare Pages — site + editable admin

The `functions/` folder replaces `server.js` on Cloudflare: same admin panel
(`/admin`), same passwords, same editing flow — running on Cloudflare's edge
with content stored in KV. The animations and effects are pure front-end and
work identically.

## One-time setup (about 5 minutes)

### 1. Create the KV namespace
Cloudflare dashboard → **Storage & Databases → KV** → **Create a namespace** →
name it `hand-content`.

### 2. Bind it to your Pages project
Your Pages project (`hand-dev`) → **Settings → Bindings** (or **Functions →
KV namespace bindings**) → **Add binding**:
- Variable name: `CONTENT_KV`  ← must be exactly this
- KV namespace: `hand-content`

### 3. Add the secrets
Same Settings page → **Environment variables** → add these three for
**Production** (mark each as *Secret/Encrypt*):

| Name | Value |
|---|---|
| `PASSWORD_OWNER` | your password |
| `PASSWORD_PARTNER` | your partner's password |
| `SESSION_SECRET` | a long random string — 40+ characters (generate with `openssl rand -hex 32`, or any password generator) |

### 4. Deploy with the functions folder
- **Git-connected project:** just push — the `functions/` directory at the
  project root is picked up automatically.
- **Direct upload:** `npx wrangler pages deploy . --project-name=hand-dev`
  from inside this folder (drag-and-drop in the dashboard also bundles
  `functions/`).

Bindings and environment variables only take effect on the **next deploy**,
so deploy (or retry the latest deployment) after steps 1–3.

### 5. Use it
- Site: `https://hand-dev.pages.dev` — all effects work out of the box
- Admin: `https://hand-dev.pages.dev/admin` — sign in, edit, save; refresh
  the site to see changes

## How it works

| Piece | Implementation |
|---|---|
| Content storage | KV key `content` (auto-backup at `content:backup` on every save) |
| Default content | The bundled `content.json` is used until the first save |
| Page injection | `functions/_middleware.js` uses HTMLRewriter to insert the saved content + `cms.js` into every page |
| Auth | Passwords checked against the encrypted env vars; session is an HMAC-signed cookie (30 days), so no server state |
| Rate limiting | 8 failed logins per IP per 15 minutes (tracked in KV) |
| Node leftovers | `server.js` and `auth.json` are blocked from being served (you can also simply delete them when deploying to Cloudflare) |

## Changing passwords on Cloudflare
Edit `PASSWORD_OWNER` / `PASSWORD_PARTNER` in Settings → Environment
variables and redeploy. Changing `SESSION_SECRET` signs everyone out.

## Local development
`node server.js` still works exactly as before (see BACKEND-SETUP.md) —
the Node and Cloudflare backends coexist; the right one runs depending on
where the folder is deployed.
