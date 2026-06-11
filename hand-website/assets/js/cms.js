/* HAND — content hydration.
   The server injects window.HAND_CONTENT (from content.json) into <head>
   along with this script, so hydration runs before main.js initializes
   motion. Opened statically (no server), this file is absent or
   HAND_CONTENT is undefined and pages show their baked-in defaults. */

(function () {
  "use strict";
  var C = window.HAND_CONTENT;
  if (!C) return;

  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function t(el, text) { if (el && typeof text === "string") el.textContent = text; }
  function tml(el, text) { // plain text with \n → <br>
    if (!el || typeof text !== "string") return;
    el.textContent = "";
    text.split("\n").forEach(function (line, i) {
      if (i) el.appendChild(document.createElement("br"));
      el.appendChild(document.createTextNode(line));
    });
  }
  function each(list, items, fn) {
    if (!Array.isArray(items)) return;
    list.forEach(function (el, i) { if (items[i]) fn(el, items[i], i); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var body = document.body;
    var s = C.site || {};

    /* ---- Site-wide: footer + contact details ---- */
    qa("a[href^='mailto:']").forEach(function (a) {
      if (s.email) { a.href = "mailto:" + s.email; if (a.textContent.indexOf("@") !== -1) a.textContent = s.email; }
    });
    qa("a[href^='tel:']").forEach(function (a) {
      if (s.phoneHref) a.href = "tel:" + s.phoneHref;
      if (s.phoneDisplay && /\d/.test(a.textContent)) a.textContent = s.phoneDisplay;
    });
    t(q(".site-footer .cols > div:first-child p"), s.footerBlurb);
    t(q(".site-footer .baseline span:last-child"), s.footerTagline);

    /* ---- Shared: commitments (home + approach) ---- */
    var sh = C.shared || {};
    var commitmentsWrap = q(".commitments");
    if (commitmentsWrap && sh.commitments) {
      var cSection = commitmentsWrap.closest("section");
      if (cSection) { t(q(".eyebrow", cSection), sh.commitmentsEyebrow); t(q("h2", cSection), sh.commitmentsHeadline); }
      each(qa(".commitment", commitmentsWrap), sh.commitments, function (el, item) {
        t(q("h4", el), item.title); t(q("p", el), item.desc);
      });
    }

    /* ---- Subpage hero (eyebrow / h1 / lede) ---- */
    var hero = q(".hero .container");
    function hydrateHero(d) {
      if (!hero || !d) return;
      t(q(".eyebrow", hero), d.heroEyebrow);
      t(q("h1", hero), d.heroHeadline);
      t(q(".lede", hero), d.heroLede);
    }

    /* ================= HOME ================= */
    if (body.classList.contains("page-home")) {
      var h = C.home || {};
      t(q(".hero-inner h1"), h.heroHeadline);
      t(q(".hero-inner .lede"), h.heroLede);
      t(q(".hero-inner .btn-primary"), h.heroPrimaryBtn);
      t(q(".hero-inner .btn-outline"), h.heroSecondaryBtn);

      var marksWrap = q(".logo-strip .marks");
      if (marksWrap && Array.isArray(h.clientMarks)) {
        marksWrap.textContent = "";
        h.clientMarks.forEach(function (m) {
          var span = document.createElement("span");
          span.className = "mark"; span.textContent = m;
          marksWrap.appendChild(span);
        });
      }
      t(q(".logo-strip .stat"), h.clientStripStat);

      var painList = q(".pain-list");
      if (painList) {
        var pSection = painList.closest("section");
        t(q(".eyebrow", pSection), h.problemEyebrow);
        tml(q("h2", pSection), h.problemHeadline);
        each(qa("li", painList), h.problemItems, function (el, txt) { el.textContent = txt; });
      }

      var stmtSection = q(".scrub-statement");
      if (stmtSection) { t(q(".eyebrow", stmtSection), h.statementEyebrow); t(q(".scrub-words", stmtSection), h.statement); }

      t(q(".contrast .panel.them h4"), h.contrastThemTitle);
      t(q(".contrast .panel.them .flow"), h.contrastThemFlow);
      t(q(".contrast .panel.us h4"), h.contrastUsTitle);
      t(q(".contrast .panel.us .flow"), h.contrastUsFlow);

      var svcGrid = q(".grid-3");
      if (svcGrid) {
        var svcSection = svcGrid.closest("section");
        t(q(".eyebrow", svcSection), h.servicesEyebrow);
        t(q("h2", svcSection), h.servicesHeadline);
        each(qa(".card", svcGrid), h.serviceCards, function (el, item) {
          t(q("h3", el), item.title); t(q("p", el), item.desc);
        });
      }

      var cf = q(".case-feature");
      if (cf) {
        t(q(".eyebrow", cf), h.caseEyebrow);
        t(q("h3", cf), h.caseHeadline);
        var ps = qa(".body > p", cf);
        t(ps[0], h.caseBody);
        if (ps[1] && h.caseQuote) {
          ps[1].textContent = "";
          ps[1].appendChild(document.createTextNode("“" + h.caseQuote + "”"));
          ps[1].appendChild(document.createElement("br"));
          var st = document.createElement("strong");
          st.style.fontStyle = "normal";
          st.textContent = "— " + h.caseQuoteAuthor;
          ps[1].appendChild(st);
        }
        t(q(".big-stat", cf), h.caseBigStat);
        t(q(".visual p", cf), h.caseBigStatLabel);
      }

      var mock = q(".mockup-section");
      if (mock) {
        t(q(".eyebrow", mock), h.mockupEyebrow);
        t(q("h2", mock), h.mockupHeadline);
        t(q(".lede", mock), h.mockupLede);
        var front = q(".mockup-front", mock), back = q(".mockup-back", mock);
        if (front && h.mockupPrimaryImage) front.style.backgroundImage = "url('" + h.mockupPrimaryImage + "')";
        if (back && h.mockupSecondaryImage) back.style.backgroundImage = "url('" + h.mockupSecondaryImage + "')";
      }

      var proc = q(".scrub-h");
      if (proc) {
        t(q(".eyebrow", proc), h.processEyebrow);
        t(q("h2", proc), h.processHeadline);
        each(qa(".h-track .step", proc), h.processSteps, function (el, item) {
          t(q("h4", el), item.title); t(q("p", el), item.desc);
        });
        t(q(".reassure", proc), h.processReassure);
      }

      each(qa(".quote-card"), h.testimonials, function (el, item) {
        t(q("blockquote", el), item.quote); t(q(".avatar", el), item.initials);
        t(q(".name", el), item.name); t(q(".role", el), item.role);
      });

      var chips = q(".chips");
      if (chips) {
        var whoSection = chips.closest("section");
        t(q(".eyebrow", whoSection), h.whoEyebrow);
        t(q("h2", whoSection), h.whoHeadline);
        if (Array.isArray(h.industries)) {
          chips.textContent = "";
          h.industries.forEach(function (c) {
            var sp = document.createElement("span");
            sp.className = "chip"; sp.textContent = c;
            chips.appendChild(sp);
          });
        }
      }

      var lastSection = q("main > section:last-of-type");
      if (lastSection) {
        t(q(".eyebrow", lastSection), h.finalEyebrow);
        t(q("h2", lastSection), h.finalHeadline);
        t(q(".lede", lastSection), h.finalLede);
      }
    }

    /* ================= SERVICES ================= */
    if (body.classList.contains("page-services")) {
      var sv = C.services || {};
      hydrateHero(sv);
      var ids = ["strategy", "design", "care", "seo", "analytics"];
      each(ids.map(function (id) { return document.getElementById(id); }).filter(Boolean), sv.sections, function (sec, item) {
        t(q(".eyebrow", sec), item.eyebrow);
        t(q("h2", sec), item.headline);
        t(q(".lede", sec), item.lede);
        var lists = q(".pain-list", sec);
        if (lists && Array.isArray(item.deliverables)) {
          lists.textContent = "";
          item.deliverables.forEach(function (d) {
            var li = document.createElement("li"); li.textContent = d;
            lists.appendChild(li);
          });
        }
        var cards = qa(".card", sec);
        if (cards[1]) t(q("p", cards[1]), item.meaning);
      });
      var svCta = q("main > section:last-of-type");
      if (svCta) { t(q("h2", svCta), sv.ctaHeadline); t(q(".lede", svCta), sv.ctaLede); }
    }

    /* ================= WORK ================= */
    if (body.classList.contains("page-work")) {
      var w = C.work || {};
      hydrateHero(w);
      each(qa(".case-block"), w.cases, function (block, item) {
        var snaps = qa(".snapshot strong", block);
        t(snaps[0], item.client); t(snaps[1], item.industry); t(snaps[2], item.services);
        t(snaps[3], item.timeline); t(snaps[4], item.headlineResult);
        var paras = qa("h3 + p", block);
        t(paras[0], item.situation); t(paras[1], item.problem);
        t(paras[2], item.approach); t(paras[3], item.partnership);
        each(qa(".stat", block), item.stats, function (st, sd) {
          t(q(".num", st), sd.num); t(q(".label", st), sd.label);
        });
      });
      var wCta = q("main > section:last-of-type");
      if (wCta) { t(q("h2", wCta), w.ctaHeadline); t(q(".lede", wCta), w.ctaLede); }
    }

    /* ================= APPROACH ================= */
    if (body.classList.contains("page-approach")) {
      var ap = C.approach || {};
      hydrateHero(ap);
      var orb = q(".orbital-section");
      if (orb) {
        t(q(".eyebrow", orb), ap.orbitalEyebrow);
        t(q("h2", orb), ap.orbitalHeadline);
        t(q(".lede", orb), ap.orbitalLede);
      }
      each(qa(".timeline .step"), ap.steps, function (el, item) {
        t(q("h4", el), item.title);
        var p = q("p", el);
        if (p && item.desc) {
          p.textContent = "";
          p.appendChild(document.createTextNode(item.desc + " "));
          var b = document.createElement("strong");
          b.textContent = item.time || "";
          p.appendChild(b);
        }
      });
      t(q(".reassure"), ap.reassure);
      var fitCards = qa(".grid-2 .card");
      if (fitCards.length === 2) {
        var fitSection = fitCards[0].closest("section");
        t(q("h2", fitSection), ap.fitHeadline);
        [ap.fitItems, ap.notFitItems].forEach(function (items, ci) {
          var ul = q(".pain-list", fitCards[ci]);
          if (ul && Array.isArray(items)) {
            ul.textContent = "";
            items.forEach(function (txt) {
              var li = document.createElement("li"); li.textContent = txt;
              ul.appendChild(li);
            });
          }
        });
      }
    }

    /* ================= ABOUT ================= */
    if (body.classList.contains("page-about")) {
      var ab = C.about || {};
      t(q(".hero h1"), ab.heroHeadline);
      var why = q("main > section.section");
      if (why) {
        t(q(".eyebrow", why), ab.whyEyebrow);
        t(q("h2", why), ab.whyHeadline);
        t(q(".lede", why), ab.whyLede);
        var extras = qa("p:not(.lede)", why);
        t(extras[0], ab.whyPara2); t(extras[1], ab.whyPara3);
      }
      var grids = qa(".grid-3");
      if (grids[0]) each(qa(".card", grids[0]), ab.values, function (el, item) {
        t(q("h3", el), item.title); t(q("p", el), item.desc);
      });
      if (grids[1]) each(qa(".card", grids[1]), ab.team, function (el, item) {
        t(q(".avatar", el), item.initials);
        t(q("h3", el), item.name);
        var p = q("p", el);
        if (p) {
          p.textContent = "";
          var b = document.createElement("strong"); b.textContent = item.role;
          p.appendChild(b);
          p.appendChild(document.createTextNode(" " + (item.bio || "")));
        }
      });
      each(qa(".stat-row .stat"), ab.stats, function (el, item) {
        t(q(".num", el), item.num); t(q(".label", el), item.label);
      });
      var abCta = q("main > section:last-of-type");
      if (abCta) { t(q("h2", abCta), ab.ctaHeadline); t(q(".lede", abCta), ab.ctaLede); }
    }

    /* ================= AUDIT ================= */
    if (body.classList.contains("page-audit")) {
      var au = C.audit || {};
      hydrateHero(au);
      t(q(".grid-2 h2"), au.coversHeadline);
      var covers = q(".pain-list");
      if (covers && Array.isArray(au.covers)) {
        covers.textContent = "";
        au.covers.forEach(function (cv) {
          var li = document.createElement("li");
          var b = document.createElement("strong"); b.textContent = cv.title;
          li.appendChild(b);
          li.appendChild(document.createTextNode(" — " + cv.desc));
          covers.appendChild(li);
        });
      }
      t(q(".grid-2 p[style]"), au.noObligation);
      each(qa(".quote-card"), au.quotes, function (el, item) {
        t(q("blockquote", el), item.quote); t(q(".avatar", el), item.initials);
        t(q(".name", el), item.name); t(q(".role", el), item.role);
      });
    }

    /* ================= CONTACT ================= */
    if (body.classList.contains("page-contact")) {
      var co = C.contact || {};
      hydrateHero(co);
      var qc = q(".quote-card");
      if (qc && co.asideQuote) {
        t(q("blockquote", qc), co.asideQuote.quote); t(q(".avatar", qc), co.asideQuote.initials);
        t(q(".name", qc), co.asideQuote.name); t(q(".role", qc), co.asideQuote.role);
      }
    }

    /* ================= FAQ ================= */
    if (body.classList.contains("page-faq")) {
      var f = C.faq || {};
      t(q(".hero h1"), f.heroHeadline);
      var firstItem = q(".faq-item");
      if (firstItem && Array.isArray(f.items) && f.items.length) {
        var holder = firstItem.parentNode;
        qa(".faq-item", holder).forEach(function (el) { holder.removeChild(el); });
        f.items.forEach(function (item) {
          var d = document.createElement("details");
          d.className = "faq-item";
          var sum = document.createElement("summary"); sum.textContent = item.q;
          var ans = document.createElement("div"); ans.className = "answer";
          var p = document.createElement("p"); p.textContent = item.a;
          ans.appendChild(p);
          d.appendChild(sum); d.appendChild(ans);
          holder.appendChild(d);
        });
      }
      var fCta = q("main > section:last-of-type");
      if (fCta) { t(q("h2", fCta), f.ctaHeadline); t(q(".lede", fCta), f.ctaLede); }
    }
  });
})();
