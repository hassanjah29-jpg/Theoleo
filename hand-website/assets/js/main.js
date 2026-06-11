/* HAND — motion engine. Spec: MOTION-SYSTEM.md
   One rAF loop drives header state, parallax, and magnetic buttons.
   Everything degrades: no JS → full content, reduced motion → no animation. */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Gate for CSS hidden states — set before first paint (script is at end of body)
  document.documentElement.classList.add("motion-ready");

  document.addEventListener("DOMContentLoaded", function () {

    /* ---------- Mobile navigation ---------- */
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    var menuOpen = false;
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        menuOpen = links.classList.toggle("open");
        toggle.classList.toggle("is-open", menuOpen);
        toggle.setAttribute("aria-expanded", menuOpen ? "true" : "false");
        toggle.textContent = menuOpen ? "✕" : "☰";
      });
    }

    /* ---------- Card-link arrow: wrap trailing arrow for the glide ---------- */
    document.querySelectorAll(".card-link").forEach(function (link) {
      var text = link.textContent;
      if (text && text.trim().slice(-1) === "→") {
        link.textContent = text.replace(/\s*→\s*$/, " ");
        var arrow = document.createElement("span");
        arrow.className = "arrow";
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "→";
        link.appendChild(arrow);
      }
    });

    /* ---------- Scroll reveal with auto-stagger ---------- */
    var GROUPS = ".grid-2, .grid-3, .timeline, .commitments, .chips, .stat-row, .pain-list, .snapshot";
    document.querySelectorAll(".reveal").forEach(function (section) {
      section.querySelectorAll(GROUPS).forEach(function (group) {
        var step = group.classList.contains("chips") ? 40 : 70;
        Array.prototype.forEach.call(group.children, function (child, i) {
          child.classList.add("reveal-item");
          child.style.transitionDelay = Math.min(i, 5) * step + "ms";
        });
      });
    });

    var maskTargets = document.querySelectorAll(".case-feature .visual");
    if (!reduced) {
      maskTargets.forEach(function (el) { el.classList.add("reveal-mask"); });
    }

    /* ---------- Scroll-scrub chapters (Apple-style pinned storytelling) ----------
       A [data-scrub] section gets a height of data-scrub-len (vh); its
       .scrub-stage pins via position:sticky while scroll progress 0–1
       drives the chapter's effect. Without JS or with reduced motion,
       chapters render as normal static sections. */
    var scrubs = [];
    if (!reduced) {
      document.querySelectorAll("[data-scrub]").forEach(function (sec) {
        // Horizontal chapters fall back to a wrapped grid on small screens
        if (sec.hasAttribute("data-scrub-desktop") && window.innerWidth < 860) return;
        var len = parseFloat(sec.getAttribute("data-scrub-len")) || 200;
        sec.style.height = len + "vh";
        sec.setAttribute("data-scrub-active", "");

        var entry = { el: sec, words: null, track: null, viewport: null, lit: -1 };

        var wordEl = sec.querySelector(".scrub-words");
        if (wordEl) {
          var words = wordEl.textContent.trim().split(/\s+/);
          wordEl.textContent = "";
          words.forEach(function (word, i) {
            var span = document.createElement("span");
            span.className = "w";
            span.textContent = word;
            wordEl.appendChild(span);
            if (i < words.length - 1) wordEl.appendChild(document.createTextNode(" "));
          });
          wordEl.classList.add("is-split");
          entry.words = wordEl.querySelectorAll(".w");
        }

        entry.track = sec.querySelector(".h-track");
        entry.viewport = sec.querySelector(".h-viewport");
        scrubs.push(entry);
      });
    }

    function updateScrubs() {
      for (var i = 0; i < scrubs.length; i++) {
        var s = scrubs[i];
        var rect = s.el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) continue;
        var range = rect.height - window.innerHeight;
        var p = range > 0 ? Math.min(Math.max(-rect.top / range, 0), 1) : 1;
        s.el.style.setProperty("--p", p.toFixed(4));

        if (s.words) {
          // words finish lighting at 85% so the statement holds, complete, for a beat
          var count = Math.floor(Math.min(p / 0.85, 1) * s.words.length);
          if (count !== s.lit) {
            for (var w = 0; w < s.words.length; w++) {
              s.words[w].classList.toggle("lit", w < count);
            }
            s.lit = count;
          }
        }

        if (s.track && s.viewport) {
          var max = s.track.scrollWidth - s.viewport.clientWidth;
          if (max > 0) {
            s.track.style.transform = "translate3d(" + (-p * max).toFixed(1) + "px,0,0)";
          }
        }
      }
    }

    var revealEls = document.querySelectorAll(".reveal, .reveal-mask");
    if ("IntersectionObserver" in window && !reduced) {
      var revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          entry.target.querySelectorAll(".reveal-item").forEach(function (item) {
            item.classList.add("in");
          });
          revealIO.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
      revealEls.forEach(function (el) { revealIO.observe(el); });
    } else {
      revealEls.forEach(function (el) {
        el.classList.add("in");
        el.querySelectorAll(".reveal-item").forEach(function (i) { i.classList.add("in"); });
      });
    }

    /* ---------- Stat counters: numbers feel measured, not asserted ---------- */
    function animateCount(el, prefix, value, suffix, decimals) {
      var start = null;
      var DURATION = 900;
      function frame(ts) {
        if (!start) start = ts;
        var t = Math.min((ts - start) / DURATION, 1);
        var eased = 1 - Math.pow(1 - t, 4); // ease-out quart
        el.textContent = prefix + (value * eased).toFixed(decimals) + suffix;
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    var counters = [];
    document.querySelectorAll(".stat .num, .big-stat").forEach(function (el) {
      var text = el.textContent.trim();
      var m = text.match(/^([^0-9]*)(\d+(?:\.\d+)?)([^0-9]*)$/);
      if (!m || text.indexOf("–") !== -1) return; // skip ranges like "#1–3"
      counters.push({
        el: el,
        prefix: m[1],
        value: parseFloat(m[2]),
        suffix: m[3],
        decimals: (m[2].split(".")[1] || "").length
      });
    });

    if (counters.length && "IntersectionObserver" in window && !reduced) {
      var countIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var c = counters.find(function (x) { return x.el === entry.target; });
          if (c) animateCount(c.el, c.prefix, c.value, c.suffix, c.decimals);
          countIO.unobserve(entry.target);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (c) {
        c.el.textContent = c.prefix + (0).toFixed(c.decimals) + c.suffix;
        countIO.observe(c.el);
      });
    }

    /* ---------- Magnetic primary buttons (fine pointers only) ---------- */
    if (finePointer && !reduced) {
      document.querySelectorAll(".btn-primary").forEach(function (btn) {
        var raf = null;
        var current = { x: 0, y: 0 };
        var target = { x: 0, y: 0 };

        function tick() {
          current.x += (target.x - current.x) * 0.18;
          current.y += (target.y - current.y) * 0.18;
          var settled = Math.abs(target.x - current.x) < 0.1 && Math.abs(target.y - current.y) < 0.1;
          if (!settled) {
            btn.style.transform = "translate(" + current.x.toFixed(2) + "px," + current.y.toFixed(2) + "px)";
            raf = requestAnimationFrame(tick);
          } else if (target.x === 0 && target.y === 0) {
            current.x = current.y = 0;
            btn.style.transform = "";
            btn.style.willChange = "";
            raf = null;
          } else {
            current.x = target.x;
            current.y = target.y;
            btn.style.transform = "translate(" + current.x + "px," + current.y + "px)";
            raf = null;
          }
        }

        btn.addEventListener("mousemove", function (e) {
          var r = btn.getBoundingClientRect();
          var dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
          var dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
          var MAX = 5;
          target.x = Math.max(-MAX, Math.min(MAX, dx));
          target.y = Math.max(-MAX, Math.min(MAX, dy));
          btn.style.willChange = "transform";
          if (!raf) raf = requestAnimationFrame(tick);
        });
        btn.addEventListener("mouseleave", function () {
          target.x = 0;
          target.y = 0;
          if (!raf) raf = requestAnimationFrame(tick);
        });
      });
    }

    /* ---------- Page signature effects (one distinct effect per page) ---------- */
    var body = document.body;
    var fx = { railLinks: null, railSections: null, workBlocks: null, tlFill: null, tlSteps: null, tl: null };

    // Services: floating index rail that tracks the current section
    if (!reduced && body.classList.contains("page-services") && window.innerWidth >= 1360) {
      var ids = ["strategy", "design", "care", "seo", "analytics"];
      var sections = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
      if (sections.length) {
        var rail = document.createElement("nav");
        rail.className = "service-rail";
        rail.setAttribute("aria-label", "Service sections");
        sections.forEach(function (sec, i) {
          var eyebrow = sec.querySelector(".eyebrow");
          var label = eyebrow ? eyebrow.textContent.split("—").pop().trim() : ids[i];
          var a = document.createElement("a");
          a.href = "#" + sec.id;
          var n = document.createElement("span");
          n.className = "n";
          n.textContent = "0" + (i + 1);
          var l = document.createElement("span");
          l.className = "l";
          l.textContent = label;
          a.appendChild(n);
          a.appendChild(l);
          rail.appendChild(a);
        });
        body.appendChild(rail);
        fx.railLinks = rail.querySelectorAll("a");
        fx.railSections = sections;
      }
    }

    // Work: cinematic focus — the case study nearest viewport center is sharp
    if (!reduced && body.classList.contains("page-work")) {
      fx.workBlocks = Array.prototype.slice.call(document.querySelectorAll(".case-block"));
    }

    // Approach: the Method timeline draws itself as you read it
    if (!reduced && body.classList.contains("page-approach")) {
      fx.tl = document.querySelector(".timeline");
      if (fx.tl) {
        var fill = document.createElement("div");
        fill.className = "t-progress";
        fill.setAttribute("aria-hidden", "true");
        fx.tl.appendChild(fill);
        fx.tlFill = fill;
        fx.tlSteps = Array.prototype.slice.call(fx.tl.querySelectorAll(".step"));
      }
    }

    // About: gentle 3D tilt on value/team cards
    if (!reduced && finePointer && body.classList.contains("page-about")) {
      document.querySelectorAll(".card").forEach(function (card) {
        card.addEventListener("mouseenter", function () {
          card.style.transition = "transform 160ms cubic-bezier(0.33,1,0.68,1)";
        });
        card.addEventListener("mousemove", function (e) {
          var r = card.getBoundingClientRect();
          var rx = ((e.clientY - r.top) / r.height - 0.5) * -4;
          var ry = ((e.clientX - r.left) / r.width - 0.5) * 5;
          card.style.transform = "translateY(-4px) perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
        });
        card.addEventListener("mouseleave", function () {
          card.style.transition = "";
          card.style.transform = "";
        });
      });
    }

    // FAQ: cascading entrance + real accordion physics
    if (body.classList.contains("page-faq")) {
      document.querySelectorAll(".reveal .faq-item").forEach(function (item, i) {
        item.classList.add("reveal-item");
        item.style.transitionDelay = Math.min(i, 7) * 50 + "ms";
      });
      if (!reduced && "animate" in Element.prototype) {
        document.querySelectorAll(".faq-item").forEach(function (item) {
          var summary = item.querySelector("summary");
          var answer = item.querySelector(".answer");
          if (!summary || !answer) return;
          summary.addEventListener("click", function (e) {
            e.preventDefault();
            if (item.hasAttribute("data-animating")) return;
            item.setAttribute("data-animating", "");
            answer.style.overflow = "hidden";
            if (item.open) {
              var closing = answer.animate(
                [{ height: answer.scrollHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }],
                { duration: 240, easing: "cubic-bezier(0.65,0,0.35,1)" }
              );
              closing.onfinish = function () {
                item.open = false;
                answer.style.overflow = "";
                item.removeAttribute("data-animating");
              };
            } else {
              item.open = true;
              var opening = answer.animate(
                [{ height: "0px", opacity: 0 }, { height: answer.scrollHeight + "px", opacity: 1 }],
                { duration: 320, easing: "cubic-bezier(0.22,1,0.36,1)" }
              );
              opening.onfinish = function () {
                answer.style.overflow = "";
                item.removeAttribute("data-animating");
              };
            }
          });
        });
      }
    }

    // Mockup showcase: front/back layers counter-drift as the section passes
    var mockupVisual = reduced ? null : document.querySelector("[data-mockup]");
    var mockupFront = mockupVisual ? mockupVisual.querySelector(".mockup-front") : null;
    var mockupBack = mockupVisual ? mockupVisual.querySelector(".mockup-back") : null;

    function updatePageFx() {
      var vh = window.innerHeight;

      if (mockupVisual) {
        var mr = mockupVisual.getBoundingClientRect();
        if (mr.bottom > 0 && mr.top < vh) {
          var md = ((mr.top + mr.height / 2) - vh / 2) / vh; // -0.5..0.5-ish
          if (mockupFront) mockupFront.style.transform = "translate3d(0," + (md * 34).toFixed(1) + "px,0)";
          if (mockupBack) mockupBack.style.transform = "translate3d(0," + (md * -26).toFixed(1) + "px,0)";
        }
      }

      if (fx.railSections) {
        var current = -1;
        for (var i = 0; i < fx.railSections.length; i++) {
          if (fx.railSections[i].getBoundingClientRect().top <= vh * 0.45) current = i;
        }
        for (var j = 0; j < fx.railLinks.length; j++) {
          fx.railLinks[j].classList.toggle("current", j === current);
        }
      }

      if (fx.workBlocks) {
        for (var k = 0; k < fx.workBlocks.length; k++) {
          var block = fx.workBlocks[k];
          var r = block.getBoundingClientRect();
          if (r.bottom < -100 || r.top > vh + 100) continue;
          var d = Math.abs((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2);
          d = Math.min(Math.max(d, 0), 1);
          block.style.transform = "scale(" + (1 - d * 0.02).toFixed(4) + ")";
          block.style.opacity = (1 - d * 0.4).toFixed(3);
        }
      }

      if (fx.tlFill) {
        var tr = fx.tl.getBoundingClientRect();
        var p = Math.min(Math.max((vh * 0.65 - tr.top) / tr.height, 0), 1);
        fx.tlFill.style.transform = "scaleY(" + p.toFixed(4) + ")";
        for (var s = 0; s < fx.tlSteps.length; s++) {
          var passed = fx.tlSteps[s].getBoundingClientRect().top < vh * 0.65;
          fx.tlSteps[s].classList.toggle("passed", passed);
          fx.tlSteps[s].classList.toggle("dim", !passed);
        }
      }
    }

    /* ---------- One rAF loop: header, scrub chapters, subpage parallax ---------- */
    var header = document.querySelector(".site-header");
    // Subpage hero parallax only — the index hero is a scrub chapter
    var heroBlock = document.querySelector(".hero .container");
    var lastY = window.scrollY;
    var ticking = false;
    var parallaxOn = !reduced && window.innerWidth >= 860;

    function onFrame() {
      ticking = false;
      var y = window.scrollY;

      if (header) {
        header.classList.toggle("is-scrolled", y > 24);
        if (menuOpen || y <= 480) {
          header.classList.remove("is-hidden");
        } else if (y > lastY + 4) {
          header.classList.add("is-hidden");
        } else if (y < lastY - 2) {
          header.classList.remove("is-hidden");
        }
      }

      if (parallaxOn && heroBlock && y < window.innerHeight) {
        heroBlock.style.transform = "translate3d(0," + (y * -0.08).toFixed(1) + "px,0)";
      }

      updateScrubs();
      updatePageFx();

      lastY = y;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onFrame);
      }
    }, { passive: true });
    onFrame();

    /* ---------- Forms: client-side handling for the static demo.
       To go live, point the form `action` at your endpoint
       (Formspree, Basin, Netlify Forms) and remove this handler. ---------- */
    document.querySelectorAll("form[data-demo]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var success = form.querySelector(".form-success");
        if (success) {
          success.style.display = "block";
          success.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
        }
        form.querySelectorAll("input, select, textarea, button").forEach(function (el) {
          el.disabled = true;
        });
      });
    });

    /* ---------- Footer year ---------- */
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  });
})();
