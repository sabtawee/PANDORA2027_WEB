"use client";

import { useEffect, useRef } from "react";

/**
 * Number that counts up from 0 the first time it scrolls into view.
 * The server renders the final value, so it reads correctly without JS
 * and for people who prefer reduced motion.
 */
export function CountUp({ value, locale, duration = 1600 }: { value: number; locale: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US");

  useEffect(() => {
    const el = ref.current;
    if (!el || value <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    const nf = new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US");
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          el.textContent = nf.format(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, locale, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {fmt.format(value)}
    </span>
  );
}
