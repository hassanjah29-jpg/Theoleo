# HAND — Static Marketing Website (MVP)

The Minimum Viable Version of the HAND website, built from `HAND-website-master-strategy.md`.

## Run it

Fully static — no build step. Unzip/clone, then open `index.html` in a browser, or serve the folder with any static host (Netlify, Vercel, GitHub Pages, S3, nginx).

```
hand-website/
├── index.html        Homepage — 11-section guided sales experience
├── services.html     All five services (consolidated MVP page)
├── work.html         Three deep case studies
├── approach.html     The HAND Method + Commitments + fit
├── about.html        Story, values, team, stats
├── audit.html        Free Website Audit lead magnet
├── contact.html      Book-a-call form + contact options
├── faq.html          Objection handling
├── MOTION-SYSTEM.md  Full interaction & motion design spec
└── assets/
    ├── css/styles.css   Design system + motion layer (tokens, hovers, reveals)
    └── js/main.js       Motion engine: scroll-aware header, staggered reveals,
                         stat counters, magnetic buttons, parallax, forms
```

## Motion

The interaction system is specified in `MOTION-SYSTEM.md` and fully implemented:
transform/opacity-only animations, one rAF loop for scroll effects, hover effects
gated to fine pointers, and complete `prefers-reduced-motion` fallbacks. Without
JavaScript the site renders fully visible and static.

## Before going live

- **Forms** currently show a success message client-side only (`data-demo` handler in `main.js`). Point each form's `action` at a real endpoint (Formspree, Basin, Netlify Forms, or your own) and remove the demo handler.
- **Placeholder content**: client names, testimonials, case-study metrics, team bios, stats, email, and phone number are illustrative examples from the strategy document. Replace with real data — the trust system only works if every number is true.
- **Booking**: replace the contact form with (or add) an embedded scheduler (Cal.com, Calendly, SavvyCal) per the conversion strategy.
- Add real imagery (work screenshots, team photos) and favicons/OG images.
- Fonts load from Google Fonts (Fraunces + Inter); self-host them if you prefer.
