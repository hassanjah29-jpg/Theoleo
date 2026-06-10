# HAND — Interaction & Motion Design System

**Apple-level interaction quality, HAND's own identity. Calm, physical, intentional.**

This document is the implementable spec. Every token, curve, and behavior described here ships in `assets/css/styles.css` (motion layer) and `assets/js/main.js`. Nothing in this system is decorative; every motion either confirms an action, directs attention, or communicates craft.

---

## 1. Motion Principles

1. **Motion is physics, not theater.** Elements glide, settle, and respond like objects with mass. Nothing bounces, spins, or flashes.
2. **Fast in, slow out.** Almost everything uses strong ease-out curves: interfaces respond instantly, then settle gently. This is the core of the "Apple feel."
3. **One thing moves at a time.** Attention is a budget. Staggers exist to sequence attention, never to show off.
4. **Distance is small.** Reveal travel is 16–24px, hover lift is 2–6px, scale is 1.01–1.03. Premium motion is felt more than seen.
5. **Transform and opacity only.** No animated layout properties (width/height/top/margin) — guarantees 60fps and no layout thrash.
6. **Motion is optional.** Every behavior collapses gracefully under `prefers-reduced-motion: reduce` and on devices without hover.

---

## 2. Design Tokens

```css
:root {
  /* Durations */
  --dur-instant: 120ms;   /* state confirms: active press, toggles */
  --dur-fast:    200ms;   /* hovers, link underlines, icon shifts */
  --dur-base:    320ms;   /* card elevation, menu items, accordions */
  --dur-slow:    560ms;   /* section settles, header hide/show */
  --dur-reveal:  720ms;   /* scroll-in reveals, hero entrance */

  /* Easing */
  --ease-out:    cubic-bezier(0.22, 1, 0.36, 1);   /* signature: fast in, long settle */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);   /* movement between states */
  --ease-soft:   cubic-bezier(0.33, 1, 0.68, 1);   /* small hovers */

  /* Travel */
  --rise-hover: -4px;      /* card lift */
  --rise-reveal: 20px;     /* scroll-in distance */
  --scale-hover: 1.015;    /* image/visual zoom */
  --stagger: 70ms;         /* per-item delay in groups */
}
```

**Rules of use**
- Hover responses: `--dur-fast` + `--ease-soft`. Never slower — hovers must feel attached to the cursor.
- Entrances: `--dur-reveal` + `--ease-out`, opacity 0→1 with `translateY(var(--rise-reveal))`.
- Exits/dismissals are ~30% faster than entrances (things leave quicker than they arrive).
- Stagger groups cap at 6 items; beyond that, remaining items share the last delay.

---

## 3. Hover System

| Element | Behavior | Spec |
|---|---|---|
| **Cards** | Glide + soft elevation | `translateY(-4px)`, shadow grows from hairline to `0 12px 32px rgba(28,26,23,.08)`, border warms toward accent at 25% — `--dur-base`, `--ease-out` |
| **Buttons (primary)** | Magnetic + press physics | JS magnet: button translates toward cursor up to 5px (lerp 0.18, rAF), springs back on leave; CSS: `scale(1.02)` hover, `scale(0.985)` active at `--dur-instant` |
| **Buttons (outline)** | Fill sweep | Background fills via `transform: scaleY` on a `::before` layer, text color crossfades — `--dur-fast` |
| **Text links** | Drawn underline | `::after` 1px line scales `scaleX(0→1)` from left, `--dur-fast --ease-soft`; on leave it exits to the right (transform-origin swap) — the line "travels through" |
| **Card links ("Learn more →")** | Arrow glide | Arrow is a separate span; on card hover it translates 4px right, gap closes — `--dur-fast` |
| **Nav links** | Underline + color | Same drawn underline at 2px below baseline; `aria-current` shows a persistent line |
| **Chips** | Lift + tint | `translateY(-2px)`, border → accent, background → accent-soft, `--dur-fast` |
| **Logo strip marks** | Focus crossfade | Marks rest at 55% ink; hovered mark rises to full ink while siblings stay — a quiet "attention" effect |
| **Imagery / case visual** | Contained zoom | Inner layer `scale(1.015)` over `--dur-slow` — the slow zoom reads as confidence |

All hover effects are wrapped in `@media (hover: hover) and (pointer: fine)` — touch devices never get sticky hover states. Keyboard users get equivalent `:focus-visible` rings (2px accent, 3px offset) with zero motion penalty.

**Why it builds trust:** consistent, immediate, small responses everywhere teach the visitor in three seconds that *everything here is considered* — the same inference they'll make about HAND's client work.

---

## 4. Scroll System

### Reveal-on-scroll
- Sections enter at `opacity: 0; translateY(20px)`, settle with `--dur-reveal --ease-out` when 12% visible (IntersectionObserver, `unobserve` after firing — reveals never replay).
- Grid children (`.grid-2`, `.grid-3`, `.timeline`, `.commitments`) auto-stagger at 70ms per item. The stagger is applied by JS so non-JS visitors see full content instantly.

### Layered depth (parallax, restrained)
- Exactly two parallax layers on the site: the hero headline block (drifts up at 0.08× scroll delta) and the featured case-study visual (counter-drifts at 0.06×). Driven by `requestAnimationFrame` reading `scrollY` once per frame, applying `translate3d` only.
- Disabled below 860px viewport width and under reduced motion. Parallax is seasoning, not structure.

### Stat counters
- Numbers (`.stat .num`, `.big-stat`) count from 0 to their value over 900ms with `--ease-out` interpolation when scrolled into view, preserving prefix/suffix and decimals (`+212%`, `1.2s`, `99.98%`). Numbers that aren't simple values (e.g. `#1–3`) render statically.
- **Purpose:** counting makes results feel *measured*, and pulls the eye to proof at the exact moment it enters the viewport.

### Image/visual reveal
- The case-feature visual un-masks with `clip-path: inset(0 12% 0 0 → 0)` + slight descale (1.04→1) on first intersection — content appears to be *uncovered*, not faded in.

### Scroll-aware header
See §7 Navigation.

### Sticky narrative
- The MVP keeps one sticky element (the header). The Growth version may add a sticky process rail on Approach (stage labels pin while descriptions scroll) — specified here so it inherits the same tokens when built.

**Why it builds trust:** reveal timing creates rhythm — each section gets a beat of attention, which is what makes the homepage feel like a guided presentation instead of a page.

---

## 5. Loading & Transition States

- **Page entrance:** hero children (eyebrow → headline → lede → buttons) cascade in once per load: 600ms, `--ease-out`, 90ms stagger, starting 80ms after first paint. Below-fold content does not animate on load — only on scroll.
- **Cross-page transitions:** `@view-transition { navigation: auto; }` enables a ~250ms crossfade between pages in supporting browsers (progressive enhancement; instant elsewhere). Shared header/footer remain visually stable, so navigation feels like one continuous surface.
- **Form submission:** button compresses (`scale(0.985)`), label swaps to a quiet confirmation, success panel slides in at `--dur-base`. No spinners anywhere on a static site — nothing should take long enough to need one.
- **Fonts:** `display=swap` with metric-compatible fallbacks; no FOIT, no layout jump masked by animation.

---

## 6. Homepage Motion Score (section by section)

| # | Section | Initial state | Entrance | Scroll | Hover | Perception goal |
|---|---|---|---|---|---|---|
| 1 | **Hero** | Children hidden (opacity 0, +16px) | Cascade: eyebrow→H1→lede→CTAs, 90ms stagger | Headline drifts up 0.08× (desktop) | CTAs: magnetic primary, sweep outline | First 2 seconds establish craft — the cascade is the handshake |
| — | **Logo strip** | Static | Fades with section | none | Mark focus crossfade | Proof should feel *solid* — minimal motion = credibility |
| 2 | **Problem** | Hidden | Section reveal; pain items stagger 70ms | none | none | Three beats land one at a time, like spoken points |
| 3 | **Reframe** | Hidden | Reveal; "them" panel first, "us" panel +140ms | none | "Us" panel lifts 2px | The delayed second panel literally *answers* the first |
| 4 | **Services** | Hidden | Grid stagger 70ms | none | Card glide + arrow slide | Five disciplines presented like products, not bullet points |
| 5 | **Case feature** | Visual masked | Clip-path un-mask + body reveal; `+212%` counts up | Visual counter-drifts 0.06× | Visual slow zoom 1.015 | The number counting = results being measured before your eyes |
| 6 | **Process** | Hidden | Steps stagger left-to-right 70ms | none | Step card lift 2px | Sequence animating *in sequence* embodies "a system, not a scramble" |
| 7 | **Testimonials** | Hidden | Stagger 70ms | none | Quote card glide | Volume of proof arriving calmly, not carousel-spinning |
| 8 | **Who it's for** | Hidden | Chips stagger 40ms | none | Chip lift + tint | Quick, light beat between two heavy proof sections |
| 9 | **Commitments** | Hidden | Items stagger; accent border draws via `scaleY` | none | none | Promises drawn like signatures — deliberate, in writing |
| 10 | **Final CTA** | Hidden | Reveal, then primary button gets one 2px settle pulse | none | Magnetic CTA | All remaining attention lands on a single, confident ask |

---

## 7. Navigation Experience

- **Sticky + scroll-aware:** header is always sticky. Past 480px scroll, scrolling *down* hides it (`translateY(-100%)`, `--dur-slow --ease-in-out`); any scroll *up* returns it immediately. Reading is never interrupted; the exit is never more than a flick away. (Hide is suppressed while the mobile menu is open.)
- **Scrolled state:** after 24px, the header gains a soft shadow and its backdrop blur deepens — a quiet signal that content is passing underneath.
- **Active state:** drawn underline persists on the current page's link; hover draws the same line on siblings, so current vs. available reads instantly.
- **Mobile menu:** panel slides down 12px + fades at `--dur-base`; links cascade at 50ms stagger; toggle icon crossfades ☰→✕ with a 90° rotation at `--dur-fast`. Closing reverses ~30% faster.
- **Dropdowns (Growth version spec):** panels scale from `0.98` + fade at transform-origin top, `--dur-fast --ease-out`; items stagger 30ms. Never slide-from-zero-height.
- **Page transitions:** view-transition crossfade (§5) keeps the chrome stable across navigations.

---

## 8. Service Page Motion

- **Service sections** alternate background tone; each reveals as a unit with its two cards staggered (+70ms).
- **"What you get" list items** inherit group stagger — deliverables tick in like a checklist being confirmed.
- **Anchor navigation** (from homepage cards): smooth-scroll with the sticky-header offset; target section's eyebrow underlines briefly (600ms draw) to confirm arrival.
- **Capability/stack rows (Growth spec):** logos rise 8px + fade in a 40ms-stagger wave; grayscale at rest, full color on hover.
- **Testimonial cards:** same glide/lift grammar as homepage — one vocabulary everywhere.
- **CTA closers:** identical magnetic primary + sweep outline on every page. The ask always *feels* the same.

## 9. Portfolio Motion

- **Case blocks** reveal as units; their snapshot bar items stagger 40ms — client, industry, result land like credentials being placed on a table.
- **Stat rows** count up on entry (the signature proof moment, reused deliberately).
- **Project previews (cards on Work hub, Growth version):** image layer zooms 1.03 inside a fixed mask while the card lifts — the "window onto work" effect; title arrow glides.
- **Galleries (Growth spec):** crossfade + 1.01 settle between images (`--dur-base`); never slide-carousels.
- **Before/after comparisons (Growth spec):** divider handle follows the pointer with 0.15 lerp smoothing; on first reveal, the divider auto-sweeps 35%→65%→50% over 1.2s to teach the interaction without a label.
- **Case study page transitions (Growth spec):** clicked card's image becomes the view-transition shared element, expanding into the case-study hero — the Apple "object continuity" move.

## 10. Performance & Accessibility Contract

- **Compositor-only:** every animation is `transform` + `opacity` (+ `clip-path` once, on first reveal only). No animated box-shadows on large surfaces — elevation uses a pre-rendered shadow on a pseudo-element crossfaded via opacity.
- **One rAF loop** drives parallax, magnetic buttons, and header state; it reads scroll once per frame and is fully torn down under reduced motion.
- **IntersectionObservers disconnect** after firing; reveals never re-run.
- **No `will-change` hoarding** — applied only during magnetic interaction, removed on leave.
- **`prefers-reduced-motion: reduce`:** all reveals render visible immediately; parallax, magnets, counters (snap to final value), cascades, and view transitions are disabled. The site is fully usable and complete without a single animation.
- **Touch:** hover effects gated by `(hover: hover) and (pointer: fine)`; tap targets get `:active` press feedback only.
- **Keyboard:** `:focus-visible` rings on all interactive elements; motion never gates reachability; menu and accordions are standard disclosure semantics.

---

*The test for every motion in this system: would removing it make the site feel less considered? If the answer is no, it doesn't ship.*
