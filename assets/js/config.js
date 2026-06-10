/* =============================================================================
   SECOND SCOOP — CENTRAL CONFIGURATION
   =============================================================================
   THIS IS THE ONLY FILE YOU NEED TO EDIT FOR DAY-TO-DAY CHANGES.

   Everything the website shows — products, prices, flavours, availability,
   secret codes, limited drops, the announcement bar, delivery info and
   region-specific content — lives here. Change a value, save the file,
   refresh the site. No other code needs touching.

   Quick guide:
     • Change a price ............ SS_CONFIG.products[...].regions.pk.price
     • Add a flavour ............. SS_CONFIG.products[...].flavours
     • Sell out a product ........ set ...regions.pk.available = false
     • Change the banner ......... SS_CONFIG.announcement
     • Change a secret code ...... SS_CONFIG.secretScoops[...].code
     • Add a limited drop ........ SS_CONFIG.drops
     • Swap in a real photo ...... set "image" to a file in assets/images/
   ========================================================================== */

const SS_CONFIG = {

  /* ---------------------------------------------------------------------------
     1. BRAND
     Core identity used in the header, footer, meta tags and About copy.
  --------------------------------------------------------------------------- */
  brand: {
    name: "Second Scoop",
    tagline: "The First Scoop Is Never Enough.",
    altTagline: "Cookie Dough Worth Going Back For.",
    mission:
      "We make desserts you can't stop thinking about — scoopable cookies, " +
      "edible cookie dough and limited drops built to be craved, shared (rarely) " +
      "and gone before you're ready.",
    instagram: "@secondscoopco",
    instagramUrl: "https://instagram.com/secondscoopco",
    email: "hello@secondscoop.co",
    whatsapp: "+92 300 0000000", // used for the Pakistan pre-order flow
  },

  /* ---------------------------------------------------------------------------
     2. ANNOUNCEMENT BAR
     The thin strip at the very top of every page. Edit the text here.
     status options: "open" (green), "closing" (amber), "closed" (muted).
  --------------------------------------------------------------------------- */
  announcement: {
    enabled: true,
    status: "closing", // "open" | "closing" | "closed"
    text: "Pre-orders close Thursday at midnight.",
    link: { label: "Order now", href: "shop-pakistan.html" },
  },

  /* ---------------------------------------------------------------------------
     3. REGIONS
     Two independent storefronts. Each has its own currency, prices (set on the
     products below) and logistics copy. Add fields freely — the shop pages
     read whatever is here.
  --------------------------------------------------------------------------- */
  regions: {
    pk: {
      id: "pk",
      label: "Pakistan",
      shortLabel: "PK",
      city: "Lahore",
      flag: "🇵🇰",
      currency: "PKR",
      symbol: "Rs",
      decimals: 0,                 // PKR shown without decimals
      shopUrl: "shop-pakistan.html",
      orderStatus: "open",         // "open" | "closing" | "closed"
      // Logistics shown on the Pakistan shop page:
      fulfilment: {
        intro:
          "We bake in small weekly batches in Lahore. Place your pre-order, " +
          "and we'll confirm your slot over WhatsApp.",
        deliveryZones: [
          { name: "DHA & Cantt", fee: "Rs 250", eta: "Same-day / next-day" },
          { name: "Gulberg, Model Town", fee: "Rs 300", eta: "Next-day" },
          { name: "Johar Town, Wapda Town", fee: "Rs 350", eta: "Next-day" },
          { name: "Rest of Lahore", fee: "Rs 450", eta: "1–2 days" },
        ],
        pickup:
          "Free pickup available from our DHA Phase 5 kitchen on confirmed " +
          "pre-order days (Fri–Sun).",
        payment:
          "Pay via bank transfer, Easypaisa or JazzCash to confirm your slot. " +
          "Cash on delivery available within DHA & Cantt.",
        notes:
          "Orders are baked fresh to your slot — please order at least 24 hours ahead.",
      },
    },
    toronto: {
      id: "toronto",
      label: "Toronto",
      shortLabel: "TO",
      city: "Toronto",
      flag: "🇨🇦",
      currency: "CAD",
      symbol: "$",
      decimals: 2,
      shopUrl: "shop-toronto.html",
      orderStatus: "open",
      fulfilment: {
        intro:
          "Baked fresh in Toronto and built to travel. Order for local delivery, " +
          "pickup, or shipping across the GTA.",
        deliveryZones: [
          { name: "Downtown & Midtown", fee: "$6", eta: "Next-day" },
          { name: "Scarborough, North York, Etobicoke", fee: "$8", eta: "Next-day" },
          { name: "Mississauga & Brampton", fee: "$10", eta: "1–2 days" },
          { name: "GTA-wide shipping", fee: "$12", eta: "2–3 days" },
        ],
        pickup:
          "Free pickup from our Liberty Village kitchen on drop weekends.",
        payment:
          "Secure card checkout at confirmation. Apple Pay & Google Pay supported.",
        notes:
          "Cookie dough ships cold-packed. Scoopies are best enjoyed within 48 hours.",
      },
    },
  },

  // Which region a brand-new visitor sees first.
  defaultRegion: "pk",

  /* ---------------------------------------------------------------------------
     4. PRODUCTS
     The OG Scoopie is the hero — keep it first; the code uses `hero: true`
     to size and highlight it everywhere.

     Each product carries shared info (description, flavours, allergens) plus a
     `regions` block with INDEPENDENT price + availability per storefront.

     `kind` controls the fallback illustration when no real photo is set:
        "scoopie" | "chunkie" | "dough" | "secret"
     `image` — leave "" to use the illustration, or point to a file you drop
        into assets/images/ (e.g. "assets/images/og-scoopie.jpg").
  --------------------------------------------------------------------------- */
  products: {

    "og-scoopie": {
      hero: true,
      name: "The OG Scoopie",
      kind: "scoopie",
      image: "",
      badge: "Signature",
      tagline: "The cookie you were never supposed to stop eating.",
      shortDesc:
        "A super-soft, warm, gooey scoopable cookie baked in a tin and made to " +
        "be eaten with a spoon.",
      longDesc:
        "Somewhere between a freshly baked cookie and a full dessert experience. " +
        "The centre stays soft, molten and indulgent while the edges pick up a " +
        "gentle chew. Baked in a tin, served warm, and engineered to disappear.",
      flavours: ["Classic", "Double Chocolate", "Biscoff Swirl"],
      ingredients:
        "Wheat flour, butter, brown sugar, cane sugar, eggs, Belgian chocolate, " +
        "vanilla, sea salt, baking soda.",
      allergens: "Contains wheat, dairy, eggs, soy. May contain nuts.",
      storage:
        "Best enjoyed warm on the day. Reheat 20–30s for that molten centre. " +
        "Keeps refrigerated up to 3 days.",
      regions: {
        pk: { price: 1450, available: true },
        toronto: { price: 14, available: true },
      },
      related: ["chunkies", "doughiginals"],
    },

    "chunkies": {
      hero: false,
      name: "Chunkies",
      kind: "chunkie",
      image: "",
      badge: "Bakery Style",
      tagline: "Thick, soft-centred, loaded.",
      shortDesc:
        "Large bakery-style cookies packed with premium chocolate and rotating " +
        "seasonal fillings.",
      longDesc:
        "Thick, soft in the middle, and absolutely loaded with chocolate. Baked " +
        "fresh and stacked tall, Chunkies are the cookie you eat with two hands. " +
        "Seasonal flavours rotate, so keep an eye on the drops.",
      flavours: ["Chocolate Chip", "Seasonal (rotating)"],
      ingredients:
        "Wheat flour, butter, brown sugar, eggs, chocolate chunks, vanilla, " +
        "sea salt, baking soda.",
      allergens: "Contains wheat, dairy, eggs, soy. May contain nuts.",
      storage:
        "Best within 2 days. Warm briefly to revive the soft centre.",
      regions: {
        pk: { price: 650, available: true },
        toronto: { price: 6.5, available: true },
      },
      related: ["og-scoopie", "doughiginals"],
    },

    "doughiginals": {
      hero: false,
      name: "The Doughiginals",
      kind: "dough",
      image: "",
      badge: "Egg-Free",
      tagline: "Cookie dough, straight from the tub.",
      shortDesc:
        "Edible cookie dough — egg-free, heat-treated and made specifically to " +
        "be eaten raw, by the spoon.",
      longDesc:
        "This is not dough for baking. It's smooth, safe-to-eat, ridiculously " +
        "good cookie dough designed to be eaten straight from the take-home tub. " +
        "Three signature flavours, all egg-free.",
      flavours: ["The Doughiginal", "Brownie Batter", "Milk & Cookies"],
      // Optional richer flavour notes shown on the product page:
      flavourNotes: {
        "The Doughiginal": "Classic chocolate chip edible cookie dough.",
        "Brownie Batter": "Rich chocolate dough inspired by brownie batter.",
        "Milk & Cookies": "Brown sugar dough with toasted milk crumb inclusions.",
      },
      ingredients:
        "Heat-treated wheat flour, butter, brown sugar, cane sugar, milk, " +
        "Belgian chocolate, vanilla, sea salt. (No eggs.)",
      allergens: "Contains wheat, dairy, soy. May contain nuts.",
      storage:
        "Keep refrigerated. Best within 7 days of opening.",
      regions: {
        pk: { price: 950, available: true },
        toronto: { price: 9, available: true },
      },
      related: ["og-scoopie", "chunkies"],
    },
  },

  /* ---------------------------------------------------------------------------
     5. SECRET SCOOP — THE VAULT
     Hidden products revealed only with a code. Add as many as you like.
     The unlock screen stays locked until a matching `code` is entered.
     Codes are case-insensitive. Unlocked products are remembered on the
     visitor's device.
  --------------------------------------------------------------------------- */
  secretScoops: [
    {
      code: "SALTED",
      product: {
        id: "secret-salted-caramel",
        name: "Salted Caramel Stuffed Scoopie",
        kind: "secret",
        image: "",
        badge: "Vault Exclusive",
        tagline: "Molten salted caramel, hidden in the middle.",
        longDesc:
          "An OG Scoopie with a secret: a core of slow-cooked salted caramel " +
          "that pulls when you dig in. Available to code-holders only.",
        regions: {
          pk: { price: 1750, available: true },
          toronto: { price: 17, available: true },
        },
      },
    },
    {
      code: "CHURRO",
      product: {
        id: "secret-churro",
        name: "Stuffed Churro Scoopie",
        kind: "secret",
        image: "",
        badge: "Vault Exclusive",
        tagline: "Cinnamon sugar, warm dulce centre.",
        longDesc:
          "Churro-spiced scoopie rolled in cinnamon sugar and stuffed with a " +
          "warm dulce de leche centre. A limited collaboration drop.",
        regions: {
          pk: { price: 1850, available: true },
          toronto: { price: 18, available: true },
        },
      },
    },
  ],

  /* ---------------------------------------------------------------------------
     6. LIMITED DROPS
     Time-boxed releases shown on the home page Drops section.
     status: "coming" (shows countdown to `launchISO`)
           | "live"   (shows "Live now" + shop link)
           | "soldout"(greyed, "Sold out")
           | "archive"(previous drops gallery)
     launchISO: ISO datetime for countdowns, e.g. "2025-12-19T19:00:00".
  --------------------------------------------------------------------------- */
  drops: [
    {
      name: "Stuffed Churro Scoopie",
      kind: "secret",
      image: "",
      status: "coming",
      launchISO: nextFriday(19), // helper below → next Friday 7pm
      blurb: "Cinnamon sugar shell, molten dulce centre. The vault favourite, unlocked for everyone.",
    },
    {
      name: "Salted Caramel Stuffed Scoopie",
      kind: "secret",
      image: "",
      status: "live",
      blurb: "Slow-cooked salted caramel, hidden in a warm Scoopie. Going fast.",
      link: "vault.html",
    },
    {
      name: "Cookies & Cream Doughiginal",
      kind: "dough",
      image: "",
      status: "soldout",
      blurb: "Our summer drop. Sold out in 41 minutes.",
    },
    {
      name: "Tahini Espresso Chunkie",
      kind: "chunkie",
      image: "",
      status: "archive",
      blurb: "A past collaboration drop. Gone, but not forgotten.",
    },
  ],

  /* ---------------------------------------------------------------------------
     7. HOW IT WORKS — the 3-step explainer on the home page.
  --------------------------------------------------------------------------- */
  howItWorks: [
    {
      icon: "scoop",
      title: "Choose Your Scoop",
      text: "Pick your region, then load up on Scoopies, Chunkies and dough.",
    },
    {
      icon: "bag",
      title: "Place Your Order",
      text: "Reserve your slot in our weekly pre-order. We confirm and bake fresh.",
    },
    {
      icon: "heart",
      title: "Enjoy",
      text: "Warm it, scoop it, share it (if you must). Then come back for seconds.",
    },
  ],

  /* ---------------------------------------------------------------------------
     8. FAQ — question/answer pairs for the FAQ page.
  --------------------------------------------------------------------------- */
  faq: [
    {
      q: "What is a Scoopie?",
      a: "A scoopable cookie. The OG Scoopie is baked in a tin and stays warm, " +
         "soft and gooey in the middle — eaten with a spoon, not your hands.",
    },
    {
      q: "What is edible cookie dough?",
      a: "It's cookie dough made to be eaten raw. We use heat-treated flour and " +
         "no eggs, so it's safe to eat straight from the tub.",
    },
    {
      q: "Can I bake The Doughiginals?",
      a: "Nope — The Doughiginals are made for eating raw, not baking. They won't " +
         "behave like regular cookie dough in the oven.",
    },
    {
      q: "How long do products last?",
      a: "Scoopies are best the day they arrive (3 days refrigerated). Chunkies " +
         "keep ~2 days. Cookie dough keeps about 7 days refrigerated.",
    },
    {
      q: "Do you deliver?",
      a: "Yes — across Lahore (Pakistan) and the GTA (Toronto). Pickup is also " +
         "available on drop days. See your region's shop page for zones and fees.",
    },
    {
      q: "How do Secret Scoops work?",
      a: "Secret Scoops live in The Vault. Enter a code we share via Instagram or " +
         "SMS to unlock a hidden product you can then add to your cart.",
    },
    {
      q: "How do pre-orders work?",
      a: "We bake in weekly batches. Orders open for a window, then close so we " +
         "can bake fresh to your slot. Watch the banner for the next cutoff.",
    },
  ],

  /* ---------------------------------------------------------------------------
     9. NEWSLETTER / CAPTURE — copy for the "Unlock Future Scoops" section.
     (Form submissions are captured client-side; wire up to your provider later.)
  --------------------------------------------------------------------------- */
  capture: {
    title: "Unlock Future Scoops",
    text: "Secret codes, limited drops and restock alerts — straight to your phone.",
    fields: ["name", "email", "phone"],
    success: "You're on the list. Watch your inbox for the next drop. 🍪",
  },

  /* ---------------------------------------------------------------------------
     10. INSTAGRAM — handle + the tiles shown in the feed strip.
     Replace `image` with real post images when you have them.
  --------------------------------------------------------------------------- */
  instagram: {
    handle: "@secondscoopco",
    url: "https://instagram.com/secondscoopco",
    cta: "Join The Scoop",
    posts: [
      { kind: "scoopie" }, { kind: "dough" }, { kind: "chunkie" },
      { kind: "secret" }, { kind: "scoopie" }, { kind: "dough" },
    ],
  },

  /* ---------------------------------------------------------------------------
     11. NAVIGATION — primary menu links (label + file).
  --------------------------------------------------------------------------- */
  nav: [
    { label: "Shop Pakistan", href: "shop-pakistan.html" },
    { label: "Shop Toronto", href: "shop-toronto.html" },
    { label: "The Vault", href: "vault.html" },
    { label: "Pre-Orders", href: "pre-orders.html" },
    { label: "About", href: "about.html" },
    { label: "FAQ", href: "faq.html" },
  ],
};

/* -----------------------------------------------------------------------------
   HELPER: nextFriday(hour)
   Returns an ISO string for the upcoming Friday at the given hour (24h, local).
   Used to give the demo countdown a sensible always-future target. Replace the
   `launchISO` value with your own fixed date when scheduling a real drop, e.g.
   launchISO: "2025-12-19T19:00:00"
----------------------------------------------------------------------------- */
function nextFriday(hour) {
  const d = new Date();
  const day = d.getDay();                 // 0 Sun … 6 Sat
  let add = (5 - day + 7) % 7;            // days until Friday
  if (add === 0) add = 7;                 // always look ahead a week if today
  d.setDate(d.getDate() + add);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// Expose globally for the rest of the site.
window.SS_CONFIG = SS_CONFIG;
