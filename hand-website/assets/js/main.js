/* HAND — site behaviour */

// Mobile menu
const toggle = document.querySelector(".menu-toggle");
const links = document.querySelector(".nav-links");
if (toggle && links) {
  toggle.addEventListener("click", () => links.classList.toggle("open"));
  links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => links.classList.remove("open")));
}

// Scroll reveal
const observer = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

// Stat counters
const counters = document.querySelectorAll("[data-count]");
const countObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || "";
    const dur = 1200, start = performance.now();
    const step = now => {
      const p = Math.min((now - start) / dur, 1);
      const val = target * (1 - Math.pow(1 - p, 3));
      el.textContent = (target % 1 ? val.toFixed(1) : Math.round(val)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    countObs.unobserve(el);
  });
}, { threshold: 0.5 });
counters.forEach(el => countObs.observe(el));

// Forms — show confirmation (connect to Formspree / Netlify Forms / your backend where marked TODO)
document.querySelectorAll("form[data-demo]").forEach(form => {
  form.addEventListener("submit", e => {
    e.preventDefault();
    // TODO: send form data to your form handler (e.g. Formspree, Netlify Forms, custom endpoint)
    const ok = form.querySelector(".form-success");
    if (ok) ok.style.display = "block";
    form.querySelectorAll("input, textarea, select, button").forEach(el => (el.disabled = true));
  });
});

// Footer year
document.querySelectorAll("[data-year]").forEach(el => (el.textContent = new Date().getFullYear()));
