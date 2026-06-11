/* HAND — radial orbital timeline.
   Vanilla port of the "radial-orbital-timeline" React component,
   restyled to HAND's dark emerald palette and fed with the seven
   HAND Method stages. Lives on the Approach page (#orbital).
   Click a node to expand its stage card; connected stages pulse;
   click empty space to resume the orbit. Hidden under reduced
   motion (the classic timeline below carries the content). */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Lucide-style inline icons (24px viewBox, stroked) */
  var ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14"/><path d="M15 6v14"/>',
    pen: '<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    trend: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>'
  };

  var DEFAULT_STAGES = [
    { icon: "search", related: [1] },
    { icon: "map",    related: [0, 2] },
    { icon: "pen",    related: [1, 3] },
    { icon: "code",   related: [2, 4] },
    { icon: "rocket", related: [3, 5] },
    { icon: "shield", related: [4, 6] },
    { icon: "trend",  related: [5, 0] }
  ];

  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true">' + ICONS[name] + "</svg>";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var host = document.getElementById("orbital");
    if (!host) return;
    var section = host.closest("section");
    if (reduced) { if (section) section.style.display = "none"; return; }

    var content = (window.HAND_CONTENT && window.HAND_CONTENT.approach && window.HAND_CONTENT.approach.steps) || null;
    var stages = DEFAULT_STAGES.map(function (d, i) {
      var c = content && content[i] ? content[i] : {};
      var fallback = document.querySelectorAll(".timeline .step")[i];
      var title = c.title || (fallback ? fallback.querySelector("h4").textContent : "Stage " + (i + 1));
      var desc = c.desc || (fallback ? fallback.querySelector("p").textContent : "");
      return {
        short: title.split("—")[0].trim(),
        title: title,
        phase: c.phase || "",
        time: c.time || "",
        desc: desc,
        icon: d.icon,
        related: d.related
      };
    });

    /* Build DOM */
    var stage = document.createElement("div");
    stage.className = "orbital-stage";
    stage.innerHTML =
      '<div class="orbital-ring" aria-hidden="true"></div>' +
      '<div class="orbital-core" aria-hidden="true"><span class="ping p1"></span><span class="ping p2"></span><span class="core-dot"></span></div>';
    host.appendChild(stage);

    var nodes = stages.map(function (item, i) {
      var node = document.createElement("div");
      node.className = "orbital-node";
      node.setAttribute("role", "button");
      node.setAttribute("tabindex", "0");
      node.setAttribute("aria-expanded", "false");
      node.innerHTML =
        '<span class="halo" aria-hidden="true"></span>' +
        '<span class="dot">' + svg(item.icon) + "</span>" +
        '<span class="node-label">' + (i + 1) + ". " + item.short + "</span>";

      var card = document.createElement("div");
      card.className = "orbital-card";
      var phase = item.phase ? '<span class="phase">' + item.phase + "</span>" : "";
      card.innerHTML =
        '<div class="card-top">' + phase + '<span class="time-tag">' + item.time + "</span></div>" +
        "<h4>" + item.title + "</h4>" +
        "<p>" + item.desc + "</p>" +
        '<div class="card-links"></div>';
      var links = card.querySelector(".card-links");
      item.related.forEach(function (ri) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = stages[ri].short + " →";
        b.addEventListener("click", function (e) { e.stopPropagation(); open(ri); });
        links.appendChild(b);
      });
      node.appendChild(card);
      stage.appendChild(node);

      function activate(e) { e.stopPropagation(); active === i ? close() : open(i); }
      node.addEventListener("click", activate);
      node.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(e); }
      });
      return node;
    });

    var angle = 0;
    var active = -1;
    var targetAngle = null;

    function open(i) {
      active = i;
      /* rotate the opened node to the top of the orbit */
      targetAngle = 270 - (i / stages.length) * 360;
      nodes.forEach(function (n, j) {
        n.classList.toggle("active", j === i);
        n.classList.toggle("related", stages[i].related.indexOf(j) !== -1);
        n.setAttribute("aria-expanded", j === i ? "true" : "false");
      });
      stage.classList.add("paused");
    }

    function close() {
      active = -1;
      targetAngle = null;
      nodes.forEach(function (n) {
        n.classList.remove("active", "related");
        n.setAttribute("aria-expanded", "false");
      });
      stage.classList.remove("paused");
    }

    stage.addEventListener("click", function (e) {
      if (e.target === stage || e.target.classList.contains("orbital-ring")) close();
    });

    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(stage);
    }

    function radius() {
      return Math.min(230, stage.clientWidth * 0.36);
    }

    function tick() {
      if (visible) {
        if (targetAngle !== null) {
          /* ease toward the focused node's angle */
          var diff = ((targetAngle - angle + 540) % 360) - 180;
          angle += diff * 0.08;
          if (Math.abs(diff) < 0.1) targetAngle = null;
        } else if (active === -1) {
          angle = (angle + 0.12) % 360;
        }
        var r = radius();
        nodes.forEach(function (node, i) {
          var a = ((i / stages.length) * 360 + angle) % 360;
          var rad = (a * Math.PI) / 180;
          var x = r * Math.cos(rad);
          var y = r * Math.sin(rad) * 0.92;
          var z = Math.round(100 + 50 * Math.cos(rad));
          var op = Math.max(0.45, Math.min(1, 0.45 + 0.55 * ((1 + Math.sin(rad)) / 2)));
          node.style.transform = "translate(-50%,-50%) translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
          node.style.zIndex = (i === active) ? 300 : z;
          node.style.opacity = (i === active) ? 1 : op.toFixed(3);
        });
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
})();
