# Second Scoop — Website

A fast, mobile-first storefront for Second Scoop. No build step, no server — open
`index.html` in a browser to preview, or upload the whole folder to any web host
(Netlify, Vercel, GitHub Pages, cPanel, etc.).

## The one file you edit: `assets/js/config.js`

Everything the site shows is driven from this single file. Change a value, save,
refresh. You never need to touch the HTML for day-to-day updates.

| To do this | Edit |
|---|---|
| Change a price | `products.<id>.regions.pk.price` / `.toronto.price` |
| Mark something sold out | set `...regions.<region>.available = false` |
| Add / rename a flavour | `products.<id>.flavours` |
| Swap in a real photo | set `products.<id>.image` to a file in `assets/images/` |
| Edit the top banner | `announcement.text` and `announcement.status` |
| Open/close a store | `regions.<region>.orderStatus` (`open` / `closing` / `closed`) |
| Change delivery zones / fees | `regions.<region>.fulfilment.deliveryZones` |
| Add or change a secret code | `secretScoops[].code` |
| Add a limited drop | `drops[]` (`coming` / `live` / `soldout` / `archive`) |
| Edit FAQ | `faq[]` |
| Contact details | `brand.email`, `brand.whatsapp`, `brand.instagram` |

## Pages

`index.html` (home) · `shop-pakistan.html` · `shop-toronto.html` · `about.html` ·
`pre-orders.html` · `vault.html` (Secret Scoop) · `contact.html` · `faq.html`

## Adding real product photos

1. Drop the image into `assets/images/` (e.g. `og-scoopie.jpg`).
2. In `config.js`, set that product's `image: "assets/images/og-scoopie.jpg"`.
   Until you do, the site shows a built-in illustration automatically.

## The Vault (secret codes)

Codes live in `config.js` under `secretScoops` and are case-insensitive. The two
starter codes are `SALTED` and `CHURRO`. A correct code reveals the hidden product
and is remembered on that device; a wrong one shows "Not this scoop. Try again."

## Checkout

There's no payment gateway wired in (by design). Pakistan orders open a pre-filled
WhatsApp message; Toronto orders open a pre-filled email. Swap these for a real
gateway later in `assets/js/app.js` (search for `function checkout`). Newsletter and
contact forms confirm on screen — connect them to your email/SMS provider where
marked `TODO` in `app.js`.

## Files

```
index.html, shop-*.html, about.html, pre-orders.html, vault.html, contact.html, faq.html
assets/css/styles.css   — all styling (design tokens at the top)
assets/js/config.js     — ★ your content & settings
assets/js/app.js         — site logic (cart, vault, region switch, rendering)
assets/images/           — drop real product photos here
```
