/* =============================================================================
   SECOND SCOOP — APP LOGIC  v2
   -----------------------------------------------------------------------------
   Reads everything from config.js (window.SS_CONFIG) and powers the whole site:
     • Injects shared chrome (announcement bar, header, footer, cart drawer)
     • Region switching (Pakistan / Toronto) with per-region pricing
     • Cart (add / remove / quantity / checkout) — remembered on the device
     • The Vault secret-code unlock system with sparkle particles
     • Limited drops + live countdown timers
     • Product illustrations (SVG fallbacks until you add real photos)
     • Marquee ticker strip
     • Quantity selector in product detail modal
     • Forms, FAQ accordion, scroll reveals, mobile menu
   You should rarely need to edit this file — change content in config.js.
   ========================================================================== */

(function () {
  "use strict";

  const CFG = window.SS_CONFIG;

  /* =========================================================================
     STORAGE — safe wrappers (won't crash if localStorage is unavailable)
  ========================================================================= */
  const mem = {};
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? (mem[key] ?? fallback) : JSON.parse(v);
      } catch (e) { return mem[key] ?? fallback; }
    },
    set(key, value) {
      mem[key] = value;
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    },
  };

  /* =========================================================================
     STATE
  ========================================================================= */
  const SS = {
    region:   store.get("ss_region",   CFG.defaultRegion),
    cart:     store.get("ss_cart",     []),   // [{ id, option, qty }]
    unlocked: store.get("ss_unlocked", []),   // [secret product ids]
  };
  if (!CFG.regions[SS.region]) SS.region = CFG.defaultRegion;

  /* =========================================================================
     HELPERS
  ========================================================================= */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function fmtPrice(amount, regionId = SS.region) {
    const r = CFG.regions[regionId];
    const n = Number(amount).toLocaleString("en-US", {
      minimumFractionDigits: r.decimals,
      maximumFractionDigits: r.decimals,
    });
    const sep = /[A-Za-z]$/.test(r.symbol) ? " " : "";
    return r.symbol + sep + n;
  }

  function findProduct(id) {
    if (CFG.products[id]) return { id, ...CFG.products[id] };
    const secret = CFG.secretScoops.find((s) => s.product.id === id);
    return secret ? { ...secret.product } : null;
  }

  /* =========================================================================
     SVG — logo, UI icons, and rich product illustrations
     Illustrations are stand-ins so the site looks craveable immediately.
     To use a real photo, set `image` on the product in config.js.
  ========================================================================= */
  let _uid = 0;
  const uid = () => "g" + (++_uid);

  const LOGO_MARK = `
    <svg class="logo__mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="22" r="13" fill="#C8843E"/>
      <path d="M7 22a13 13 0 0 1 26 0Z" fill="#A5662A"/>
      <circle cx="14" cy="20" r="2"   fill="#3A2114"/>
      <circle cx="24" cy="18" r="2.3" fill="#3A2114"/>
      <circle cx="22" cy="26" r="1.8" fill="#3A2114"/>
      <circle cx="16" cy="27" r="1.5" fill="#3A2114"/>
      <path d="M13 10c0-3 3-5 7-5s7 2 7 5" stroke="#E68B9C" stroke-width="3" stroke-linecap="round"/>
    </svg>`;

  const ICONS = {
    cart:      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h2.2l2.3 12.5a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.2L20 7H5.5"/></svg>',
    menu:      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close:     '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    arrow:     '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>',
    location:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    truck:     '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h12v9H2zM14 9h4l3 3v3h-7z"/><circle cx="6.5" cy="17.5" r="1.6"/><circle cx="17.5" cy="17.5" r="1.6"/></svg>',
    wallet:    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14h2"/></svg>',
    clock:     '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    bag:       '<svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l1 12H5z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
    heart:     '<svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.6-9-9a4.7 4.7 0 0 1 9-2 4.7 4.7 0 0 1 9 2c-2 4.4-9 9-9 9Z"/></svg>',
    scoop:     '<svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 14a7 7 0 0 1 14 0Z"/><path d="M12 14v6M12 20l-2-1.5M12 20l2-1.5"/></svg>',
    mail:      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    phone:     '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l1.5 5-2 1.5a11 11 0 0 0 5 5L15 13l5 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>',
    lock:      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  };
  const icon = (name) => ICONS[name] || "";

  /* =========================================================================
     PRODUCT ILLUSTRATIONS (SVG stand-ins — rich, appetising)
     Each illustration gets unique gradient IDs to avoid SVG conflicts.
  ========================================================================= */
  function illustration(kind) {
    const a = uid(), b = uid(), c = uid(), d = uid();

    const bgGrad = `
      <linearGradient id="${b}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFF8F0"/>
        <stop offset="100%" stop-color="#F0DFC8"/>
      </linearGradient>`;

    if (kind === "scoopie" || kind === "secret") {
      const isSecret = kind === "secret";
      const accent = isSecret ? "#E68B9C" : "#C8843E";
      const label  = isSecret ? "Secret Scoop" : "The OG Scoopie";
      return `<svg class="product-illustration" viewBox="0 0 280 210" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label} illustration">
        <defs>
          ${bgGrad}
          <radialGradient id="${a}" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#FFCF8B"/>
            <stop offset="45%" stop-color="#C8843E"/>
            <stop offset="100%" stop-color="#8B5520"/>
          </radialGradient>
          <radialGradient id="${c}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#A5662A" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#3A2114" stop-opacity="0.1"/>
          </radialGradient>
        </defs>
        <!-- Background -->
        <rect width="280" height="210" fill="url(#${b})"/>
        <!-- Subtle dots pattern -->
        <circle cx="30"  cy="30"  r="2" fill="#EAD0AE" opacity="0.6"/>
        <circle cx="250" cy="40"  r="2" fill="#EAD0AE" opacity="0.6"/>
        <circle cx="20"  cy="180" r="2" fill="#EAD0AE" opacity="0.6"/>
        <circle cx="260" cy="170" r="2" fill="#EAD0AE" opacity="0.6"/>
        <!-- Tin body -->
        <rect x="68" y="105" width="144" height="60" rx="14" fill="#F0E2CC" stroke="#DEC59E" stroke-width="2"/>
        <!-- Tin shine -->
        <rect x="74" y="112" width="52" height="4" rx="2" fill="white" opacity="0.4"/>
        <!-- Shadow under tin -->
        <ellipse cx="140" cy="167" rx="68" ry="12" fill="rgba(58,33,20,0.12)"/>
        <!-- Cookie mound / scoop surface -->
        <ellipse cx="140" cy="108" rx="74" ry="26" fill="url(#${a})"/>
        <!-- Scoop highlight -->
        <ellipse cx="128" cy="101" rx="60" ry="18" fill="#E3A865" opacity="0.65"/>
        <ellipse cx="120" cy="97"  rx="40" ry="10" fill="#FFCF8B" opacity="0.35"/>
        <!-- Chocolate chip chunks — varied shapes -->
        <rect x="104" y="96"  width="14" height="12" rx="3" fill="#3A2114" transform="rotate(-10 110 102)"/>
        <ellipse cx="152" cy="100" rx="8" ry="7"  fill="#3A2114"/>
        <ellipse cx="174" cy="108" rx="7" ry="6"  fill="#4A2C1A"/>
        <rect x="126" y="108" width="11" height="9" rx="2.5" fill="#3A2114" transform="rotate(8 130 112)"/>
        <ellipse cx="114" cy="113" rx="6" ry="5"  fill="#4A2C1A"/>
        <ellipse cx="165" cy="98"  rx="5" ry="4.5" fill="#3A2114"/>
        <!-- Melted drizzle lines on tin side -->
        <path d="M115 106 Q110 118 108 128" stroke="${accent}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>
        <path d="M155 105 Q158 116 156 130" stroke="${accent}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/>
        <!-- Steam wisps -->
        <path d="M118 88 Q115 78 119 68" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.5"/>
        <path d="M140 82 Q136 72 140 60" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.45"/>
        <path d="M162 86 Q166 76 162 66" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.4"/>
        <!-- Spoon -->
        <rect x="198" y="80"  width="6"  height="58" rx="3" fill="#C8843E" transform="rotate(30 200 110)"/>
        <ellipse cx="220" cy="75" rx="10" ry="7" fill="#D8924E" transform="rotate(30 220 75)"/>
        <!-- Secret lock badge -->
        ${isSecret ? `<g transform="translate(216,30)">
          <circle cx="16" cy="16" r="20" fill="#E68B9C" opacity="0.95"/>
          <text x="16" y="22" text-anchor="middle" font-size="18">🔒</text>
        </g>` : ""}
        <!-- "Warm" badge -->
        ${!isSecret ? `<g transform="translate(8,8)">
          <rect width="60" height="22" rx="11" fill="${accent}" opacity="0.9"/>
          <text x="30" y="15.5" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="10" font-weight="700">WARM · GOOEY</text>
        </g>` : ""}
      </svg>`;
    }

    if (kind === "dough") {
      return `<svg class="product-illustration" viewBox="0 0 280 210" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Edible cookie dough illustration">
        <defs>
          ${bgGrad}
          <radialGradient id="${a}" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#FFDE99"/>
            <stop offset="55%" stop-color="#C8843E"/>
            <stop offset="100%" stop-color="#8B5520"/>
          </radialGradient>
          <linearGradient id="${c}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FFFBF4"/>
            <stop offset="100%" stop-color="#F5EDD9"/>
          </linearGradient>
        </defs>
        <rect width="280" height="210" fill="url(#${b})"/>
        <!-- Shadow -->
        <ellipse cx="140" cy="172" rx="62" ry="12" fill="rgba(58,33,20,0.12)"/>
        <!-- Tub body -->
        <path d="M84 90 L78 155 Q78 163 86 165 L194 165 Q202 163 202 155 L196 90 Z" fill="url(#${c})" stroke="#EAD6BC" stroke-width="2"/>
        <!-- Tub rim (lid ring) -->
        <rect x="76" y="78" width="128" height="16" rx="8" fill="#F3B9C4"/>
        <rect x="80" y="82" width="120" height="8" rx="4" fill="#E68B9C" opacity="0.5"/>
        <!-- Dough surface inside tub -->
        <ellipse cx="140" cy="92" rx="56" ry="18" fill="url(#${a})"/>
        <ellipse cx="134" cy="87" rx="44" ry="12" fill="#E3A865" opacity="0.6"/>
        <!-- Choc chips in dough -->
        <ellipse cx="122" cy="88" rx="6" ry="5.5" fill="#3A2114"/>
        <ellipse cx="150" cy="85" rx="6.5" ry="6"   fill="#3A2114"/>
        <ellipse cx="136" cy="96" rx="5"   ry="4.5" fill="#4A2C1A"/>
        <ellipse cx="162" cy="90" rx="5.5" ry="5"   fill="#3A2114"/>
        <ellipse cx="118" cy="96" rx="4"   ry="3.5" fill="#4A2C1A"/>
        <!-- Label on tub -->
        <rect x="92" y="118" width="96" height="30" rx="6" fill="white" opacity="0.75"/>
        <text x="140" y="131" text-anchor="middle" fill="#3A2114" font-family="Georgia,serif" font-size="9" font-weight="700" font-style="italic">The Doughiginals</text>
        <text x="140" y="143" text-anchor="middle" fill="#7A5A44" font-family="system-ui,sans-serif" font-size="7.5">EGG-FREE · EAT RAW</text>
        <!-- Spoon with dough -->
        <rect x="194" y="62" width="8" height="54" rx="4" fill="#C8843E" transform="rotate(22 196 90)"/>
        <ellipse cx="215" cy="58" rx="12" ry="9" fill="#D89A52" transform="rotate(22 215 58)"/>
        <ellipse cx="215" cy="56" rx="7" ry="5" fill="#FFDE99" transform="rotate(22 215 58)" opacity="0.7"/>
        <!-- "Eat raw" badge -->
        <g transform="translate(10,10)">
          <rect width="72" height="22" rx="11" fill="#E68B9C" opacity="0.92"/>
          <text x="36" y="15.5" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="10" font-weight="700">SAFE TO EAT RAW</text>
        </g>
      </svg>`;
    }

    // Chunkie cookie
    return `<svg class="product-illustration" viewBox="0 0 280 210" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chunkie cookie illustration">
      <defs>
        ${bgGrad}
        <radialGradient id="${a}" cx="48%" cy="35%" r="68%">
          <stop offset="0%" stop-color="#FFCF8B"/>
          <stop offset="45%" stop-color="#C8843E"/>
          <stop offset="100%" stop-color="#8B5520"/>
        </radialGradient>
        <radialGradient id="${c}" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stop-color="rgba(58,33,20,0.18)"/>
          <stop offset="100%" stop-color="rgba(58,33,20,0)"/>
        </radialGradient>
      </defs>
      <rect width="280" height="210" fill="url(#${b})"/>
      <!-- Drop shadow -->
      <ellipse cx="142" cy="162" rx="72" ry="18" fill="url(#${c})"/>
      <!-- Cookie base — thick -->
      <ellipse cx="142" cy="148" rx="72" ry="20" fill="#A5662A"/>
      <!-- Cookie top surface -->
      <ellipse cx="142" cy="132" rx="72" ry="50" fill="url(#${a})"/>
      <!-- Surface highlight -->
      <ellipse cx="130" cy="115" rx="54" ry="34" fill="#E3A865" opacity="0.45"/>
      <ellipse cx="122" cy="108" rx="34" ry="18" fill="#FFDE99" opacity="0.3"/>
      <!-- Big chocolate chunks — irregular shapes -->
      <path d="M108 115 L120 112 L122 126 L109 128 Z" fill="#3A2114"/>
      <path d="M152 108 L165 106 L167 119 L152 121 Z" fill="#3A2114" transform="rotate(8 160 113)"/>
      <ellipse cx="140" cy="138" rx="9" ry="8"   fill="#4A2C1A"/>
      <path d="M120 132 L128 130 L130 140 L120 141 Z" fill="#3A2114"/>
      <ellipse cx="165" cy="130" rx="8" ry="7"   fill="#3A2114"/>
      <ellipse cx="127" cy="148" rx="6" ry="5"   fill="#5A3A22"/>
      <ellipse cx="158" cy="145" rx="5" ry="4.5" fill="#4A2C1A"/>
      <ellipse cx="104" cy="138" rx="6" ry="5"   fill="#3A2114"/>
      <!-- Melted choc pools -->
      <path d="M110 123 Q106 130 110 136" stroke="#7B3F14" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.5"/>
      <path d="M166 122 Q172 128 168 135" stroke="#7B3F14" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.5"/>
      <!-- Cookie crumbs -->
      <circle cx="68"  cy="145" r="4" fill="#C8843E" opacity="0.5"/>
      <circle cx="60"  cy="155" r="2.5" fill="#A5662A" opacity="0.4"/>
      <circle cx="218" cy="148" r="3.5" fill="#C8843E" opacity="0.5"/>
      <circle cx="225" cy="140" r="2"   fill="#A5662A" opacity="0.4"/>
      <!-- "Chunkie" badge -->
      <g transform="translate(8,10)">
        <rect width="68" height="22" rx="11" fill="#3A2114" opacity="0.9"/>
        <text x="34" y="15.5" text-anchor="middle" fill="#FBF2E4" font-family="system-ui,sans-serif" font-size="10" font-weight="700">BAKERY-STYLE</text>
      </g>
    </svg>`;
  }

  // Returns markup for a product's media (real image if set, else illustration).
  function media(p, extraClass = "") {
    if (p.image) {
      return `<div class="product-media${extraClass ? " " + extraClass : ""}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"></div>`;
    }
    return `<div class="product-media${extraClass ? " " + extraClass : ""}">${illustration(p.kind || "scoopie")}</div>`;
  }

  /* =========================================================================
     TOAST
  ========================================================================= */
  let toastTimer;
  function toast(msg) {
    let t = $("#ss-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "ss-toast";
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.innerHTML = icon("cart") + "<span>" + esc(msg) + "</span>";
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2700);
  }

  /* =========================================================================
     CHROME — announcement, header, footer, cart drawer, product modal
  ========================================================================= */
  function renderAnnounce() {
    const a = CFG.announcement;
    if (!a.enabled) return "";
    const link = a.link ? ` <a href="${esc(a.link.href)}">${esc(a.link.label)} →</a>` : "";
    return `<div class="announce" data-status="${esc(a.status)}">
      <div class="announce__inner">
        <span class="announce__dot"></span>
        <span>${esc(a.text)}${link}</span>
        <button class="announce__close" aria-label="Dismiss" onclick="this.closest('.announce').remove()">×</button>
      </div>
    </div>`;
  }

  function renderHeader(page) {
    const links = CFG.nav.map((n) => {
      const active = page && n.href.indexOf(page) === 0 ? " is-active" : "";
      const vault  = n.href.indexOf("vault") !== -1 ? " vault-link" : "";
      return `<a class="nav__link${vault}${active}" href="${esc(n.href)}">${esc(n.label)}</a>`;
    }).join("");

    return `<header class="header" id="ss-header">
      <div class="wrap header__inner">
        <a class="logo" href="index.html" aria-label="${esc(CFG.brand.name)} home">${LOGO_MARK}${esc(CFG.brand.name)}</a>
        <nav class="nav" id="ss-nav" aria-label="Primary">
          ${links}
          ${regionSwitchHTML("nav")}
        </nav>
        <div class="header__actions">
          ${regionSwitchHTML("header")}
          <button class="cart-btn" id="ss-cart-open" aria-label="Open cart">
            ${icon("cart")}<span class="cart-count" id="ss-cart-count">0</span>
          </button>
          <button class="menu-toggle" id="ss-menu-toggle" aria-label="Menu" aria-expanded="false">${icon("menu")}</button>
        </div>
      </div>
    </header>`;
  }

  function regionSwitchHTML(ctx) {
    return `<div class="region-switch" data-rs="${ctx}" role="group" aria-label="Choose region">${
      Object.values(CFG.regions).map((r) =>
        `<button data-region="${r.id}" class="${r.id === SS.region ? "is-active" : ""}">
           <span aria-hidden="true">${r.flag}</span>${esc(r.shortLabel)}
         </button>`).join("")
    }</div>`;
  }

  function renderFooter() {
    const b = CFG.brand;
    return `<footer class="footer">
      <div class="wrap footer__top">
        <div class="footer__brand">
          <a class="logo" href="index.html">${LOGO_MARK}${esc(b.name)}</a>
          <p>${esc(b.mission)}</p>
          <div class="footer__region">${regionSwitchHTML("footer")}</div>
        </div>
        <div class="footer__col">
          <h4>Shop</h4>
          <a href="shop-pakistan.html">Shop Pakistan ${CFG.regions.pk.flag}</a>
          <a href="shop-toronto.html">Shop Toronto ${CFG.regions.toronto.flag}</a>
          <a href="vault.html">The Vault</a>
          <a href="index.html#drops">Limited Drops</a>
        </div>
        <div class="footer__col">
          <h4>Company</h4>
          <a href="about.html">About</a>
          <a href="pre-orders.html">How Pre-Orders Work</a>
          <a href="faq.html">FAQ</a>
          <a href="contact.html">Contact</a>
        </div>
        <div class="footer__col">
          <h4>Follow</h4>
          <a href="${esc(b.instagramUrl)}" target="_blank" rel="noopener">Instagram</a>
          <a href="contact.html">Wholesale</a>
          <a href="#" onclick="return false">Terms</a>
          <a href="#" onclick="return false">Privacy Policy</a>
        </div>
      </div>
      <div class="wrap footer__bottom">
        <span>© ${new Date().getFullYear()} ${esc(b.name)}. The first scoop is never enough.</span>
        <div class="footer__social">
          <a href="${esc(b.instagramUrl)}" target="_blank" rel="noopener" aria-label="Instagram">${icon("instagram")}</a>
          <a href="mailto:${esc(b.email)}" aria-label="Email">${icon("mail")}</a>
        </div>
      </div>
    </footer>`;
  }

  function renderDrawer() {
    return `<div class="overlay" id="ss-overlay" aria-hidden="true"></div>
      <aside class="drawer" id="ss-drawer" aria-label="Shopping cart" aria-hidden="true">
        <div class="drawer__head">
          <h3>Your Scoops</h3>
          <button class="drawer__close" id="ss-cart-close" aria-label="Close cart">${icon("close")}</button>
        </div>
        <div class="drawer__body" id="ss-cart-body"></div>
        <div class="drawer__foot"  id="ss-cart-foot"></div>
      </aside>
      <div class="pd-modal" id="ss-pd-modal" role="dialog" aria-modal="true" aria-hidden="true"></div>`;
  }

  /* =========================================================================
     CART
  ========================================================================= */
  function cartKey(id, option) { return id + "::" + (option || ""); }

  function addToCart(id, option, qty = 1) {
    const key = cartKey(id, option);
    const existing = SS.cart.find((c) => cartKey(c.id, c.option) === key);
    if (existing) {
      existing.qty = Math.max(1, existing.qty + qty);
    } else {
      SS.cart.push({ id, option: option || "", qty: Math.max(1, qty) });
    }
    store.set("ss_cart", SS.cart);
    updateCartUI(true);
    const p = findProduct(id);
    toast(`Added ${p ? p.name : "item"} to cart 🍪`);
  }

  function setQty(id, option, delta) {
    const item = SS.cart.find((c) => cartKey(c.id, c.option) === cartKey(id, option));
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) SS.cart = SS.cart.filter((c) => c !== item);
    store.set("ss_cart", SS.cart);
    updateCartUI();
  }

  function removeFromCart(id, option) {
    SS.cart = SS.cart.filter((c) => cartKey(c.id, c.option) !== cartKey(id, option));
    store.set("ss_cart", SS.cart);
    updateCartUI();
  }

  function cartCount() { return SS.cart.reduce((n, c) => n + c.qty, 0); }

  function cartTotal() {
    return SS.cart.reduce((sum, c) => {
      const p = findProduct(c.id);
      const r = p && p.regions[SS.region];
      return sum + (r ? r.price * c.qty : 0);
    }, 0);
  }

  function updateCartUI(bump) {
    const count = cartCount();
    const badge = $("#ss-cart-count");
    if (badge) {
      badge.textContent = count;
      badge.classList.toggle("has-items", count > 0);
      if (bump) {
        badge.classList.remove("cart-bump");
        void badge.offsetWidth;
        badge.classList.add("cart-bump");
      }
    }

    const body = $("#ss-cart-body");
    const foot = $("#ss-cart-foot");
    if (!body || !foot) return;

    if (!SS.cart.length) {
      body.innerHTML = `<div class="drawer__empty">
        <div class="big">🍪</div>
        <p>Your cart is empty.<br>The first scoop is never enough — go get one.</p>
      </div>`;
      foot.innerHTML = `<a class="btn btn-primary btn-block" href="${esc(CFG.regions[SS.region].shopUrl)}">Start Scooping ${icon("arrow")}</a>`;
      return;
    }

    body.innerHTML = SS.cart.map((c) => {
      const p = findProduct(c.id);
      if (!p) return "";
      const r = p.regions[SS.region];
      const opt       = c.option ? `<div class="cart-item__opt">${esc(c.option)}</div>` : "";
      const priceLine = r
        ? `<div class="cart-item__price">${fmtPrice(r.price * c.qty)}</div>`
        : `<div class="cart-item__opt">Unavailable here</div>`;
      return `<div class="cart-item">
        <div class="cart-item__media">${p.image ? `<img src="${esc(p.image)}" alt="">` : illustration(p.kind)}</div>
        <div>
          <div class="cart-item__name">${esc(p.name)}</div>
          ${opt}
          <div class="qty">
            <button aria-label="Decrease" onclick="SS.setQty('${esc(c.id)}','${esc(c.option)}',-1)">−</button>
            <span>${c.qty}</span>
            <button aria-label="Increase" onclick="SS.setQty('${esc(c.id)}','${esc(c.option)}',1)">+</button>
          </div>
        </div>
        <div style="text-align:right">
          ${priceLine}
          <button class="cart-item__remove" onclick="SS.removeFromCart('${esc(c.id)}','${esc(c.option)}')">Remove</button>
        </div>
      </div>`;
    }).join("");

    const r = CFG.regions[SS.region];
    foot.innerHTML = `
      <div class="drawer__total">
        <span>Subtotal</span>
        <span class="price">${fmtPrice(cartTotal())}</span>
      </div>
      <p class="drawer__note">Pre-order subtotal in ${esc(r.currency)} · delivery calculated at confirmation.</p>
      <button class="btn btn-primary btn-block" id="ss-checkout">Place Pre-Order ${icon("arrow")}</button>`;
    const co = $("#ss-checkout");
    if (co) co.addEventListener("click", checkout);
  }

  // Checkout: builds order summary → WhatsApp (Pakistan) or email (Toronto).
  // Replace with a real payment gateway when ready.
  function checkout() {
    const r = CFG.regions[SS.region];
    const lines = SS.cart.map((c) => {
      const p = findProduct(c.id);
      const sub = p && p.regions[SS.region] ? fmtPrice(p.regions[SS.region].price * c.qty) : "";
      return `• ${c.qty}× ${p ? p.name : c.id}${c.option ? " (" + c.option + ")" : ""} — ${sub}`;
    }).join("\n");
    const msg = `Hi Second Scoop! I'd like to pre-order (${r.label}):\n\n${lines}\n\nSubtotal: ${fmtPrice(cartTotal())}`;

    if (SS.region === "pk") {
      const digits = (CFG.brand.whatsapp || "").replace(/[^0-9]/g, "");
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, "_blank");
    } else {
      window.location.href = `mailto:${CFG.brand.email}?subject=${encodeURIComponent("Pre-order — Toronto")}&body=${encodeURIComponent(msg)}`;
    }
    toast("Opening your pre-order…");
  }

  function openCart() {
    const o = $("#ss-overlay"), d = $("#ss-drawer");
    if (o) o.classList.add("show");
    if (d) { d.classList.add("show"); d.setAttribute("aria-hidden","false"); }
    document.body.style.overflow = "hidden";
  }
  function closeCart() {
    const o = $("#ss-overlay"), d = $("#ss-drawer");
    if (o) o.classList.remove("show");
    if (d) { d.classList.remove("show"); d.setAttribute("aria-hidden","true"); }
    document.body.style.overflow = "";
  }

  /* =========================================================================
     REGION SWITCHING
  ========================================================================= */
  function setRegion(id) {
    if (!CFG.regions[id] || id === SS.region) return;
    SS.region = id;
    store.set("ss_region", id);
    $$(".region-switch button").forEach((btn) =>
      btn.classList.toggle("is-active", btn.dataset.region === id));
    updateCartUI();
    document.dispatchEvent(new CustomEvent("ss:region", { detail: id }));
    toast(`Now shopping ${CFG.regions[id].label} ${CFG.regions[id].flag}`);
  }

  /* =========================================================================
     PRODUCT CARD + DETAIL MODAL
  ========================================================================= */
  function productCard(p, { hero = false } = {}) {
    const r    = p.regions && p.regions[SS.region];
    const sold = r && !r.available;
    const badgeClass = p.badge === "Signature" ? " badge--signature"
      : p.kind === "secret" ? " badge--vault" : "";
    const flavours = (p.flavours || []).slice(0, 4)
      .map((f) => `<span class="tag">${esc(f)}</span>`).join("");
    const priceHTML = r
      ? `<div class="price">${fmtPrice(r.price)}</div>`
      : `<div class="price"><small>Not in this region</small></div>`;

    return `<article class="product-card${hero ? " is-hero" : ""}" data-product="${esc(p.id)}">
      <div class="product-card__inner">
        <div style="position:relative">
          ${p.badge ? `<span class="badge${badgeClass}">${esc(p.badge)}</span>` : ""}
          ${sold ? `<div class="soldout-flag">Sold out</div>` : ""}
          ${media(p)}
        </div>
        <div class="product-card__body">
          <h3 class="product-card__name">${esc(p.name)}</h3>
          <p class="product-card__tagline">${esc(p.tagline || "")}</p>
          <p class="product-card__desc">${esc(p.shortDesc || p.longDesc || "")}</p>
          ${flavours ? `<div class="product-card__flavours">${flavours}</div>` : ""}
          <div class="product-card__foot">
            ${priceHTML}
            <div style="display:flex;gap:.5rem">
              <button class="btn btn-ghost btn-sm" onclick="SS.openProduct('${esc(p.id)}')">Details</button>
              ${sold
                ? `<button class="btn btn-sm" disabled style="opacity:.5">Sold out</button>`
                : `<button class="btn btn-primary btn-sm" onclick="SS.quickAdd('${esc(p.id)}')">Add ${icon("arrow")}</button>`}
            </div>
          </div>
        </div>
      </div>
    </article>`;
  }

  // Quick add: opens modal if multiple flavours, otherwise adds directly.
  function quickAdd(id) {
    const p = findProduct(id);
    if (!p) return;
    if (p.flavours && p.flavours.length > 1) { openProduct(id); return; }
    addToCart(id, p.flavours ? p.flavours[0] : "");
  }

  // Product detail modal — now includes a quantity selector.
  function openProduct(id) {
    const p = findProduct(id);
    if (!p) return;
    const r    = p.regions && p.regions[SS.region];
    const sold = r && !r.available;
    const modal = $("#ss-pd-modal");

    const flavourSelect = (p.flavours && p.flavours.length)
      ? `<select class="select" id="ss-pd-flavour" aria-label="Choose flavour">
           ${p.flavours.map((f) => `<option>${esc(f)}</option>`).join("")}
         </select>` : "";

    // Flavour notes section
    const notes = p.flavourNotes
      ? `<div class="pd-section"><h4>Flavour notes</h4>${
          Object.entries(p.flavourNotes).map(([k, v]) =>
            `<p><strong>${esc(k)}:</strong> ${esc(v)}</p>`).join("")
        }</div>` : "";

    // Related products
    const related = (p.related || []).map((rid) => {
      const rp = findProduct(rid);
      if (!rp) return "";
      return `<div class="pd-related__item" onclick="SS.openProduct('${esc(rp.id)}')" role="button" tabindex="0">
        ${media(rp)}<span>${esc(rp.name)}</span>
      </div>`;
    }).join("");

    const badgeClass = p.badge === "Signature" ? " badge--signature"
      : p.kind === "secret" ? " badge--vault" : "";

    modal.innerHTML = `
      <div class="pd-card">
        <button class="pd-close" onclick="SS.closeProduct()" aria-label="Close">${icon("close")}</button>
        <div class="pd-grid">
          <div class="pd-media" style="position:relative">
            ${p.badge ? `<span class="badge${badgeClass}">${esc(p.badge)}</span>` : ""}
            ${media(p)}
          </div>
          <div class="pd-info">
            <h2>${esc(p.name)}</h2>
            <p class="pd-tag">${esc(p.tagline || "")}</p>
            <p style="color:var(--ink-soft);font-size:.97rem">${esc(p.longDesc || p.shortDesc || "")}</p>

            <div class="pd-buy">
              ${r ? `<div class="price" style="font-size:1.6rem">${fmtPrice(r.price)}</div>`
                  : `<div class="price"><small>Unavailable in ${esc(CFG.regions[SS.region].label)}</small></div>`}
              ${flavourSelect}
              <!-- Quantity selector -->
              ${r && !sold ? `<div class="pd-qty-wrap">
                <label>Qty</label>
                <div class="pd-qty" id="ss-pd-qty-wrap">
                  <button type="button" id="ss-pd-qty-dec" aria-label="Decrease quantity">−</button>
                  <span class="pd-qty__num" id="ss-pd-qty">1</span>
                  <button type="button" id="ss-pd-qty-inc" aria-label="Increase quantity">+</button>
                </div>
              </div>` : ""}
            </div>

            ${sold
              ? `<button class="btn btn-block" disabled style="opacity:.5">Sold out</button>`
              : (r
                  ? `<button class="btn btn-primary btn-block" onclick="SS.addFromModal('${esc(p.id)}')">Add to Cart ${icon("arrow")}</button>`
                  : `<button class="btn btn-block" disabled style="opacity:.5">Not available here</button>`)}

            ${notes}
            ${p.ingredients ? `<div class="pd-section"><h4>Ingredients</h4><p>${esc(p.ingredients)}</p></div>` : ""}
            ${p.allergens   ? `<div class="pd-section"><h4>Allergy info</h4><p>${esc(p.allergens)}</p></div>`  : ""}
            ${p.storage     ? `<div class="pd-section"><h4>Storage</h4><p>${esc(p.storage)}</p></div>`         : ""}
          </div>
        </div>
        ${related ? `<div class="pd-related"><h4>Goes well with</h4><div class="pd-related__row">${related}</div></div>` : ""}
      </div>`;

    // Wire up the qty +/- buttons
    const dec  = $("#ss-pd-qty-dec");
    const inc  = $("#ss-pd-qty-inc");
    const qnum = $("#ss-pd-qty");
    if (dec && inc && qnum) {
      dec.addEventListener("click", () => {
        const v = parseInt(qnum.textContent) || 1;
        if (v > 1) qnum.textContent = v - 1;
      });
      inc.addEventListener("click", () => {
        const v = parseInt(qnum.textContent) || 1;
        if (v < 99) qnum.textContent = v + 1;
      });
    }

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function addFromModal(id) {
    const sel  = $("#ss-pd-flavour");
    const qnum = $("#ss-pd-qty");
    const qty  = qnum ? (parseInt(qnum.textContent) || 1) : 1;
    addToCart(id, sel ? sel.value : "", qty);
    closeProduct();
  }

  function closeProduct() {
    const modal = $("#ss-pd-modal");
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    if (!$("#ss-drawer")?.classList.contains("show")) document.body.style.overflow = "";
  }

  /* =========================================================================
     PAGE BUILDERS — fill containers present on the current page
  ========================================================================= */

  // Featured products (home). OG Scoopie is rendered hero-sized first.
  function buildFeatured() {
    const el = $("#featured-grid");
    if (!el) return;
    const ids = ["og-scoopie", "chunkies", "doughiginals"];
    el.innerHTML = ids.map((id, i) => {
      const p = findProduct(id);
      return p ? productCard(p, { hero: i === 0 }) : "";
    }).join("");
  }

  // Full product catalog for shop pages.
  function buildShopGrid() {
    const el = $("#shop-grid");
    if (!el) return;
    const ids = Object.keys(CFG.products).sort((a) =>
      CFG.products[a].hero ? -1 : 1);
    el.innerHTML = ids.map((id) => {
      const p = findProduct(id);
      return p ? productCard(p) : "";
    }).join("");
  }

  // Order-status banner + logistics cards for shop pages.
  function buildShopMeta() {
    const region = CFG.regions[SS.region];
    if (!region) return;

    // 1) Status banner
    const banner = $("#shop-banner");
    if (banner) {
      const status = region.orderStatus || "open";
      const label = {
        open:    "Pre-orders open — order now",
        closing: "Closing soon — last slots",
        closed:  "Pre-orders closed — back next drop",
      }[status] || "Pre-orders open";
      banner.dataset.status = status;
      banner.innerHTML = `<span class="dot"></span>${esc(region.label)} ${region.flag} · ${esc(label)}`;
    }

    // 2) Logistics cards
    const wrap = $("#logistics");
    if (wrap) {
      const f = region.fulfilment || {};
      const zones = (f.deliveryZones || []).map((z) =>
        `<li>
           <span class="zone-name">${esc(z.name)}</span>
           <span>
             <span class="zone-fee">${esc(z.fee)}</span>
             &nbsp;·&nbsp;
             <span class="zone-eta">${esc(z.eta)}</span>
           </span>
         </li>`).join("");

      wrap.innerHTML = `
        <div class="logi-card">
          <h3><span class="ic">${icon("truck")}</span>Delivery in ${esc(region.city)}</h3>
          <ul class="zone-list">${zones}</ul>
        </div>
        <div class="logi-card">
          <h3><span class="ic">${icon("location")}</span>Pickup</h3>
          <p>${esc(f.pickup || "")}</p>
        </div>
        <div class="logi-card">
          <h3><span class="ic">${icon("wallet")}</span>Payment</h3>
          <p>${esc(f.payment || "")}</p>
          ${f.notes ? `<p style="margin-top:.8rem;font-weight:600;color:var(--cookie-deep)">${esc(f.notes)}</p>` : ""}
        </div>`;
    }

    // 3) Intro text
    const intro = $("#shop-intro");
    if (intro) intro.textContent = (region.fulfilment && region.fulfilment.intro) || "";
  }

  // How It Works (home).
  function buildHowItWorks() {
    const el = $("#how-grid");
    if (!el) return;
    el.innerHTML = CFG.howItWorks.map((s) =>
      `<div class="step reveal">
        <span class="step__num"></span>
        <div class="step__icon">${icon(s.icon)}</div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.text)}</p>
      </div>`).join("");
  }

  // Limited drops + countdown timers.
  const countdownTimers = [];
  function buildDrops() {
    const el = $("#drops-grid");
    if (!el) return;
    el.innerHTML = CFG.drops.map((d, i) => {
      const statusLabel = { coming: "Coming Soon", live: "Live Now", soldout: "Sold Out", archive: "Past Drop" }[d.status];
      const cls = d.status === "soldout" ? "is-soldout" : (d.status === "archive" ? "is-archive" : "");
      let action = "";
      if (d.status === "coming")
        action = `<div class="countdown" data-countdown="${esc(d.launchISO)}" id="cd-${i}"></div>`;
      else if (d.status === "live")
        action = `<a class="btn btn-blush btn-sm" href="${esc(d.link || "#")}" style="align-self:flex-start;margin-top:.4rem">Get it ${icon("arrow")}</a>`;
      return `<article class="drop-card ${cls}">
        <div style="position:relative">${media(d)}</div>
        <div class="drop-card__body">
          <span class="drop-status drop-status--${d.status}"><span class="ld-dot"></span>${esc(statusLabel)}</span>
          <h3>${esc(d.name)}</h3>
          <p>${esc(d.blurb)}</p>
          ${action}
        </div>
      </article>`;
    }).join("");

    $$("[data-countdown]").forEach((node) => startCountdown(node, node.dataset.countdown));
  }

  function startCountdown(node, iso) {
    const target = new Date(iso).getTime();
    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        node.innerHTML = `<div style="min-width:auto;padding:.5rem 1rem"><span class="num">Live!</span></div>`;
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000)  / 60000);
      const s = Math.floor((diff % 60000)    / 1000);
      const cell = (n, l) =>
        `<div><span class="num">${String(n).padStart(2,"0")}</span><span class="lbl">${l}</span></div>`;
      node.innerHTML = cell(d,"days") + cell(h,"hrs") + cell(m,"min") + cell(s,"sec");
    }
    tick();
    countdownTimers.push(setInterval(tick, 1000));
  }

  // Instagram strip.
  function buildInstagram() {
    const el = $("#ig-grid");
    if (!el) return;
    el.innerHTML = CFG.instagram.posts.map((post) =>
      `<a class="ig-tile" href="${esc(CFG.instagram.url)}" target="_blank" rel="noopener" aria-label="Second Scoop on Instagram">
        ${post.image ? `<img src="${esc(post.image)}" alt="" loading="lazy">` : illustration(post.kind)}
      </a>`).join("");
  }

  // Marquee ticker (home page).
  function buildTicker() {
    const el = $("#ticker-strip");
    if (!el) return;
    // Items to repeat twice for seamless loop
    const items = [
      "The OG Scoopie", "Chunkies", "The Doughiginals",
      "Warm · Gooey · Craveable", "Weekly Drops", "Secret Scoop",
      "Fresh from Lahore & Toronto", "Limited Drops",
    ];
    const html = items.map((t) =>
      `<span class="ticker__item">${esc(t)}<span class="ticker__dot" aria-hidden="true"></span></span>`
    ).join("") ;
    // Duplicate for seamless loop
    el.innerHTML = `<div class="ticker__track" aria-hidden="true">${html}${html}</div>`;
  }

  // Vault sparkle particles.
  function buildVaultParticles() {
    const vault = $(".vault");
    if (!vault) return;
    const wrap = document.createElement("div");
    wrap.className = "vault-particles";
    wrap.setAttribute("aria-hidden", "true");
    const count = 18;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "vault-particle";
      p.style.cssText = [
        `left:${Math.random() * 100}%`,
        `top:${40 + Math.random() * 55}%`,
        `--dur:${3.5 + Math.random() * 4}s`,
        `--del:${Math.random() * 5}s`,
      ].join(";");
      wrap.appendChild(p);
    }
    vault.insertBefore(wrap, vault.firstChild);
  }

  // FAQ accordion.
  function buildFAQ() {
    const el = $("#faq-list");
    if (!el) return;
    el.innerHTML = CFG.faq.map((f) =>
      `<div class="faq-item">
        <button class="faq-q" aria-expanded="false">
          ${esc(f.q)}<span class="chev" aria-hidden="true">+</span>
        </button>
        <div class="faq-a" role="region"><div class="faq-a__inner">${esc(f.a)}</div></div>
      </div>`).join("");

    $$(".faq-q", el).forEach((q) => q.addEventListener("click", () => {
      const item = q.closest(".faq-item");
      const open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open);
      const a = $(".faq-a", item);
      a.style.maxHeight = open ? a.scrollHeight + "px" : "0";
    }));
  }

  // Contact info rows (eliminates the inline script in contact.html).
  function buildContactRows() {
    const rows = $("#ci-rows");
    if (!rows) return;
    const b = CFG.brand;
    const waNumber = (b.whatsapp || "").replace(/[^0-9]/g, "");
    const items = [
      { ic: icon("mail"),     label: "Email",                 value: b.email || "",            href: b.email ? "mailto:" + b.email : "" },
      { ic: "💬",             label: "WhatsApp (Pakistan)",   value: b.whatsapp || "",          href: waNumber ? "https://wa.me/" + waNumber : "" },
      { ic: icon("instagram"),label: "Instagram",             value: b.instagram || "",         href: b.instagramUrl || "", external: true },
      { ic: "📍",             label: "Kitchens",              value: "Lahore, PK · Toronto, CA", href: "" },
    ];
    rows.innerHTML = items.map((it) => {
      const val = it.href
        ? `<a href="${esc(it.href)}"${it.external ? ' target="_blank" rel="noopener"' : ""} style="color:var(--ink-soft)">${esc(it.value)}</a>`
        : `<span>${esc(it.value)}</span>`;
      return `<div class="ci-row">
        <span class="ci-ic">${it.ic}</span>
        <div><strong>${esc(it.label)}</strong>${val}</div>
      </div>`;
    }).join("");
  }

  /* =========================================================================
     THE VAULT
  ========================================================================= */
  function initVault() {
    const form = $("#vault-form");
    if (!form) return;

    // Render any previously unlocked items on page load
    renderUnlocked();
    buildVaultParticles();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("#vault-code");
      const code  = input.value.trim().toUpperCase();
      const msg   = $("#vault-msg");
      const match = CFG.secretScoops.find((s) => s.code.toUpperCase() === code);

      if (!match) {
        msg.textContent = "Not this scoop. Try again.";
        msg.className   = "vault-msg error";
        // Briefly shake the lock
        const lockEl = $(".vault__lock-wrap");
        if (lockEl) { lockEl.style.animation = "none"; void lockEl.offsetWidth; lockEl.style.animation = ""; }
        return;
      }

      if (!SS.unlocked.includes(match.product.id)) {
        SS.unlocked.push(match.product.id);
        store.set("ss_unlocked", SS.unlocked);
      }

      msg.textContent = "Unlocked. Welcome to the inside. 🔓";
      msg.className   = "vault-msg ok";
      input.value     = "";
      renderUnlocked();

      setTimeout(() => {
        const reveal = $("#vault-reveal");
        if (reveal) reveal.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    });
  }

  function renderUnlocked() {
    const wrap = $("#vault-reveal");
    if (!wrap) return;
    const items = CFG.secretScoops.filter((s) => SS.unlocked.includes(s.product.id));
    if (!items.length) { wrap.innerHTML = ""; return; }
    wrap.innerHTML = items.map((s) => {
      const p = s.product;
      const r = p.regions && p.regions[SS.region];
      return `<div class="vault-card">
        <div style="position:relative">
          <span class="badge badge--vault">${esc(p.badge || "Vault Exclusive")}</span>
          ${media(p)}
        </div>
        <div class="product-card__body">
          <h3 class="product-card__name">${esc(p.name)}</h3>
          <p class="product-card__tagline">${esc(p.tagline || "")}</p>
          <p class="product-card__desc">${esc(p.longDesc || "")}</p>
          <div class="product-card__foot">
            <div class="price">${r ? fmtPrice(r.price) : "—"}</div>
            <div style="display:flex;gap:.5rem">
              <button class="btn btn-ghost btn-sm" onclick="SS.openProduct('${esc(p.id)}')">Details</button>
              <button class="btn btn-primary btn-sm" onclick="SS.addToCart('${esc(p.id)}','')">Add to Cart ${icon("arrow")}</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join("");
  }

  /* =========================================================================
     FORMS — newsletter / contact (client-side success only)
     Wire form submissions to Mailchimp / Klaviyo / etc. where marked.
  ========================================================================= */
  function initForms() {
    $$("[data-capture-form]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        // TODO: send data to your email/SMS provider (Mailchimp, Klaviyo, etc.)
        const ok = form.querySelector(".form-success");
        if (ok) { ok.textContent = CFG.capture.success; ok.classList.add("show"); }
        form.querySelectorAll("input").forEach((i) => (i.value = ""));
      });
    });

    const contact = $("#contact-form");
    if (contact) {
      contact.addEventListener("submit", (e) => {
        e.preventDefault();
        // TODO: send contact message to your backend / Formspree / etc.
        const ok = $("#contact-success");
        if (ok) {
          ok.textContent = "Thanks! We'll be in touch within one business day. 🍪";
          ok.classList.add("show");
        }
        contact.querySelectorAll("input,textarea").forEach((i) => (i.value = ""));
      });
    }
  }

  /* =========================================================================
     SCROLL REVEAL + STICKY HEADER + MOBILE MENU
  ========================================================================= */
  function initInteractions() {
    // Scroll reveal with IntersectionObserver
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.10, rootMargin: "0px 0px -30px 0px" });

    $$(".reveal").forEach((el) => io.observe(el));

    // Sticky header style on scroll
    const header = $("#ss-header");
    const onScroll = () => header && header.classList.toggle("is-stuck", window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Mobile menu
    const toggle = $("#ss-menu-toggle");
    const nav    = $("#ss-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("mobile-open");
        toggle.setAttribute("aria-expanded", open);
        toggle.innerHTML = open ? icon("close") : icon("menu");
        document.body.style.overflow = open ? "hidden" : "";
        // Inject a region switcher into the mobile nav if not there
        if (open && !$(".region-switch", nav)) {
          nav.insertAdjacentHTML("beforeend", `<div style="margin-top:1.2rem">${regionSwitchHTML("mobile")}</div>`);
          $$("[data-rs='mobile'] button", nav).forEach((btn) =>
            btn.addEventListener("click", () => setRegion(btn.dataset.region)));
        }
      });
      $$(".nav__link", nav).forEach((l) => l.addEventListener("click", () => {
        nav.classList.remove("mobile-open");
        toggle.innerHTML = icon("menu");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }));
    }
  }

  /* =========================================================================
     HERO ILLUSTRATION — renders the OG Scoopie into the hero art frame
  ========================================================================= */
  function buildHeroIllustration() {
    const el = $("#hero-illustration");
    if (!el) return;
    // Only populate if not already filled (real image set in config)
    if (el.children.length) return;
    const og = CFG.products["og-scoopie"];
    if (!og) return;
    el.innerHTML = og.image
      ? `<img src="${esc(og.image)}" alt="The OG Scoopie" style="width:100%;height:100%;object-fit:cover">`
      : illustration("scoopie");
  }

  /* =========================================================================
     WIRE UP GLOBAL CONTROLS
  ========================================================================= */
  function wireGlobal() {
    const cartOpen  = $("#ss-cart-open");
    const cartClose = $("#ss-cart-close");
    const overlay   = $("#ss-overlay");
    const pdModal   = $("#ss-pd-modal");

    if (cartOpen)  cartOpen.addEventListener("click", openCart);
    if (cartClose) cartClose.addEventListener("click", closeCart);
    if (overlay)   overlay.addEventListener("click", closeCart);
    if (pdModal)   pdModal.addEventListener("click", (e) => {
      if (e.target === pdModal) closeProduct();
    });

    // Wire all region switchers (header + footer + nav, injected by renderHeader/renderFooter)
    $$(".region-switch button").forEach((btn) =>
      btn.addEventListener("click", () => setRegion(btn.dataset.region)));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeCart(); closeProduct(); }
    });

    // Re-render region-dependent content when region changes
    document.addEventListener("ss:region", () => {
      buildFeatured();
      buildShopGrid();
      buildShopMeta();
      renderUnlocked();
      updateCartUI();
    });
  }

  /* =========================================================================
     BOOT — called once on DOMContentLoaded (or immediately if already loaded)
  ========================================================================= */
  function boot() {
    const page = document.body.dataset.page || "";

    // Inject shared chrome
    const top    = $("#ss-top");
    const bottom = $("#ss-bottom");
    if (top)    top.innerHTML    = renderAnnounce() + renderHeader(page);
    if (bottom) bottom.innerHTML = renderFooter();
    document.body.insertAdjacentHTML("beforeend", renderDrawer());

    // Pin region for shop pages (silently — no toast)
    if (page === "shop-pakistan") setRegionSilent("pk");
    if (page === "shop-toronto")  setRegionSilent("toronto");

    // Build sections present on this page
    buildHeroIllustration();
    buildTicker();
    buildFeatured();
    buildShopGrid();
    buildShopMeta();
    buildHowItWorks();
    buildDrops();
    buildInstagram();
    buildFAQ();
    buildContactRows();
    initVault();
    initForms();

    wireGlobal();
    updateCartUI();
    initInteractions();
  }

  function setRegionSilent(id) {
    if (!CFG.regions[id]) return;
    SS.region = id;
    store.set("ss_region", id);
    $$(".region-switch button").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.region === id));
  }

  /* Expose the handful of functions used by inline onclick handlers */
  window.SS = {
    addToCart, setQty, removeFromCart,
    openProduct, closeProduct, addFromModal, quickAdd,
    setRegion, fmtPrice,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
