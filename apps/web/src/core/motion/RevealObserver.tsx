"use client";

import { useEffect } from "react";

/**
 * Mounted once in the locale layout. Watches every [data-reveal] element
 * (including ones added later by client navigation) and adds .is-visible the
 * first time it scrolls into view. Elements already on screen at start are shown
 * immediately so nothing above the fold blinks.
 */
export function RevealObserver() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );

    const track = (root: ParentNode, initial: boolean) => {
      root.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (initial) {
          const r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) {
            el.classList.add("is-visible");
            return;
          }
        }
        io.observe(el);
      });
    };

    track(document, true);
    document.documentElement.classList.add("reveal-ready");

    const mo = new MutationObserver((muts) => {
      for (const m of muts) m.addedNodes.forEach((n) => n instanceof Element && track(n.parentNode ?? n, false));
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      document.documentElement.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
