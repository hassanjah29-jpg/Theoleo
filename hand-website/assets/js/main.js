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
    var GROUPS = ".grid-2, .grid-3, .timeline, .commitments, .chips, .stat-row, .pain-list";
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

    /* ---------- One rAF loop: scroll-aware header + parallax ---------- */
    var header = document.querySelector(".site-header");
    var heroBlock = document.querySelector(".hero .container");
    var caseFeature = document.querySelector(".case-feature");
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

      if (parallaxOn) {
        if (heroBlock && y < window.innerHeight) {
          heroBlock.style.transform = "translate3d(0," + (y * -0.08).toFixed(1) + "px,0)";
        }
        if (caseFeature) {
          var r = caseFeature.getBoundingClientRect();
          if (r.bottom > 0 && r.top < window.innerHeight) {
            var center = (r.top + r.height / 2) - window.innerHeight / 2;
            caseFeature.style.transform = "translate3d(0," + (center * -0.06).toFixed(1) + "px,0)";
          }
        }
      }

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
