# HAND — Backend & Admin Panel

Everything on the site is now editable through a password-protected admin panel.
Zero dependencies — only [Node.js](https://nodejs.org) (v18+) is required.

## Run it

```bash
cd hand-website
node server.js
```

- **Website:** http://localhost:3000
- **Admin panel:** http://localhost:3000/admin

Set a different port with `PORT=8080 node server.js`.

## How it works

| File | Role |
|---|---|
| `server.js` | Zero-dependency Node server: serves the site, injects `content.json` into every page, hosts the admin panel and the content API |
| `content.json` | Every editable piece of text on the site (a `.backup` copy is kept on each save) |
| `auth.json` | Password hashes (scrypt + salt). **Never commit real production hashes publicly; never put plain passwords here** |
| `admin/index.html` | The admin UI — sections in the sidebar, fields auto-generated from the content, add/remove for lists |
| `assets/js/cms.js` | Applies the saved content to the pages at load time |

Editing flow: sign in at `/admin` → pick a section (Home, Services, Work, FAQ…) →
edit fields (lists like FAQ items and testimonials have **+ Add item** / **Remove**) →
**Save changes** → refresh the site.

There are two passwords — one per person. Both edit the same content; the save
status shows who saved last.

## Changing a password

```bash
node server.js --set-password owner "My-New-Password"
node server.js --set-password partner "Their-New-Password"
```

(Restart the server afterwards. Sessions live in memory, so restarting also signs everyone out.)

## Security notes for going live

- Run it behind HTTPS (e.g., Caddy or nginx in front, or a Node host like Railway/Render/Fly).
- Login is rate-limited (8 attempts / 15 min per IP) and sessions are HttpOnly cookies.
- `auth.json`, `server.js`, and `content.json` are never served as static files.
- If you deploy the folder to a static host instead (no Node), the site still works —
  it simply shows the copy baked into the HTML, and `/admin` won't exist.
