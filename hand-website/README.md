# HAND — Website

A premium, static marketing website for HAND. No build step, no server — open
`index.html` in a browser to preview, or upload the whole folder to any host
(Netlify, Vercel, Cloudflare Pages, GitHub Pages, cPanel, etc.).

## Pages

| File | Page |
|---|---|
| `index.html` | Homepage (hero, trust bar, services, why HAND, process, case studies, testimonials, tech, FAQ, final CTA) |
| `services.html` | Services hub (all services, grouped) |
| `services/website-design.html` | Website Design service page |
| `services/website-development.html` | Website Development service page |
| `services/seo.html` | SEO service page |
| `portfolio.html` | Portfolio / case studies grid |
| `process.html` | 9-stage process |
| `pricing.html` | Website packages + care plans + guarantee |
| `about.html` | Story, stats, team |
| `faq.html` | Full FAQ (10 questions) |
| `contact.html` | Contact form + Calendly link |
| `free-audit.html` | Free Website Audit lead-magnet landing page |
| `thank-you.html` | Post-form confirmation |
| `privacy.html` | Privacy policy template |
| `404.html` | Not-found page |

## Before you launch — checklist

1. **Forms** — Forms currently show an on-screen confirmation only. Connect them
   to a handler (Formspree, Netlify Forms, or your backend) where marked `TODO`
   in `assets/js/main.js`. With Netlify, just add `data-netlify="true"` to each `<form>`.
2. **Calendly** — Replace `https://calendly.com/your-link/30min` in `contact.html`
   with your real booking link (or embed the Calendly inline widget).
3. **Contact details** — Search for `hello@yourdomain.com` and `+1 (000) 000-0000`
   and replace with your real email/phone.
4. **Domain** — Update the `url` in the JSON-LD block in `index.html` and the URLs
   in `sitemap.xml` with your real domain.
5. **Case studies & team** — Portfolio projects, testimonials and team profiles are
   realistic placeholders. Replace them with your real work, clients and people.
6. **Privacy policy** — Have the template in `privacy.html` reviewed by a legal
   professional in your jurisdiction.
7. **Analytics** — Add your GA4 (or Plausible/Fathom) snippet before `</head>` on
   every page.

## Customising the design

All design tokens (colours, fonts, spacing, radius) live at the top of
`assets/css/styles.css` in the `:root` block. Change the accent colour or fonts
there and the whole site follows.

## Strategy

The full strategy this site implements (positioning, SEO roadmap, growth tiers,
remaining pages to build) is in `../HAND_WEBSITE_STRATEGY.md`. This build is the
**Minimum Viable Website** tier; the Growth tier adds the remaining service pages,
industry pages, blog, and full case studies.
