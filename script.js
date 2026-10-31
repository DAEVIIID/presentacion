/* Typewriter on scroll + image fallbacks. Vanilla JS, no libraries. */
(() => {
  "use strict";

  const TYPE_MS = 30;   // ms per character when typing
  const ERASE_MS = 12;  // ms per character when erasing
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Typewriter ---------- */
  const states = new Map();

  function setup(el) {
    const text = (el.dataset.text || el.textContent).trim();
    el.dataset.text = text;            // store original text
    el.textContent = "";

    // hidden copy for screen readers
    const sr = document.createElement("span");
    sr.className = "sr"; sr.textContent = text;
    // invisible full text: reserves the final height (no layout jump)
    const ghost = document.createElement("span");
    ghost.className = "tw-ghost"; ghost.setAttribute("aria-hidden", "true"); ghost.textContent = text;
    // visible text that gets typed/erased
    const live = document.createElement("span");
    live.className = "tw-live"; live.setAttribute("aria-hidden", "true");

    el.append(sr, ghost, live);
    states.set(el, { text, live, index: 0, timer: null, keep: el.dataset.cursor === "keep" });

    if (reduceMotion) live.textContent = text;
  }

  function run(el, dir) {
    const s = states.get(el);
    clearInterval(s.timer);                       // cancel any running animation
    s.live.classList.add("cursor-on");

    s.timer = setInterval(() => {
      s.index += dir;
      s.live.textContent = s.text.slice(0, s.index);
      const done = dir > 0 ? s.index >= s.text.length : s.index <= 0;
      if (done) {
        clearInterval(s.timer);
        s.index = Math.max(0, Math.min(s.text.length, s.index));
        // keep the cursor only on marked elements, once fully typed
        if (!(dir > 0 && s.keep)) s.live.classList.remove("cursor-on");
      }
    }, dir > 0 ? TYPE_MS : ERASE_MS);
  }

  const targets = document.querySelectorAll(".tw");
  targets.forEach(setup);

  if (!reduceMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => run(e.target, e.isIntersecting ? 1 : -1));
    }, { threshold: 0.3 });
    targets.forEach((el) => io.observe(el));
  } else {
    targets.forEach((el) => { states.get(el).live.textContent = states.get(el).text; });
  }

  /* ---------- Image fallbacks ---------- */
  document.querySelectorAll(".slot img").forEach((img) => {
    const slot = img.parentElement;
    const ok = () => slot.classList.add("loaded");
    const fail = () => slot.classList.add("failed");
    if (img.complete) { img.naturalWidth > 0 ? ok() : fail(); }
    else { img.addEventListener("load", ok); img.addEventListener("error", fail); }
  });
})();