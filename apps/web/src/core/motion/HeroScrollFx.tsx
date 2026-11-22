"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

/**
 * Scroll scene for the home hero ("open the box"), layered on top of the
 * server-rendered hero, which stays complete and readable without JS.
 *
 * Desktop: the hero pins for ~1.6 screens while scrolling. The text slides
 * away, the box moves to the centre and grows, broken chains snap, the lid
 * lifts, light bursts out, then the sign-up count appears and the page moves on.
 * Phones: no pinning (it feels sticky under a thumb), just the zoom and lid
 * as the hero scrolls out. Reduced motion: nothing runs.
 *
 * Expects inside #hero: [data-hero-text], [data-hero-box] (wrapping
 * PandoraBox with its pb-* hooks), [data-hero-burst] and [data-hero-finale].
 */
export function HeroScrollFx() {
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    gsap.registerPlugin(ScrollTrigger);

    const q = gsap.utils.selector(hero);
    const mm = gsap.matchMedia();
    let lenis: Lenis | null = null;
    const raf = (time: number) => lenis?.raf(time * 1000);

    mm.add(
      {
        desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
      },
      (ctx) => {
        const { desktop } = ctx.conditions as { desktop: boolean; mobile: boolean };

        // Smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync.
        lenis = new Lenis({ lerp: 0.12 });
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);

        const box = q("[data-hero-box]")[0] as HTMLElement | undefined;
        const text = q("[data-hero-text]")[0] as HTMLElement | undefined;
        if (!box || !text) return;

        // Move the box to the horizontal centre of the hero
        const toCentre = () => {
          const h = hero.getBoundingClientRect();
          const b = box.getBoundingClientRect();
          return h.left + h.width / 2 - (b.left + b.width / 2);
        };

        // Broken chains start intact for the scene, then snap during it
        const intact = q(".pb-chain-intact");
        gsap.set(intact, { opacity: 0.95 });

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: desktop
            ? { trigger: hero, start: "top 64px", end: "+=160%", pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 }
            : { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 },
        });

        if (desktop) {
          tl.to(text, { xPercent: -30, opacity: 0, filter: "blur(6px)", duration: 1 }, 0)
            .to(box, { x: toCentre, scale: 1.45, duration: 1.2 }, 0.1)
            .to(intact, { y: 60, rotation: () => gsap.utils.random(-25, 25), opacity: 0, duration: 0.6, stagger: 0.15, ease: "power2.in" }, 0.9)
            .to(q(".pb-lock"), { opacity: 0, duration: 0.3 }, 1.2)
            .to(q(".pb-lid"), { y: -70, rotation: -14, svgOrigin: "60 172", duration: 0.8, ease: "back.out(1.6)" }, 1.4)
            .to(q(".pb-light"), { scale: 1.6, opacity: 1, svgOrigin: "200 160", duration: 0.8 }, 1.4)
            .fromTo(q("[data-hero-burst]"), { opacity: 0, scale: 0.4 }, { opacity: 0.9, scale: 1.6, duration: 0.7, ease: "power1.out" }, 1.6)
            .to(box, { scale: 1.9, opacity: 0.35, duration: 0.6 }, 2.1)
            .to(q("[data-hero-burst]"), { opacity: 0.25, duration: 0.6 }, 2.2)
            .fromTo(q("[data-hero-finale]"), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 2.25)
            .to({}, { duration: 0.4 }); // hold the finale a moment before unpinning
        } else {
          tl.to(text, { opacity: 0, y: -40, duration: 1 }, 0)
            .to(box, { scale: 1.25, duration: 1 }, 0)
            .to(intact, { y: 40, opacity: 0, duration: 0.4, stagger: 0.1 }, 0.2)
            .to(q(".pb-lid"), { y: -50, rotation: -12, svgOrigin: "60 172", duration: 0.6 }, 0.4)
            .to(q(".pb-light"), { scale: 1.4, opacity: 1, svgOrigin: "200 160", duration: 0.6 }, 0.4);
        }

        return () => {
          gsap.ticker.remove(raf);
          lenis?.destroy();
          lenis = null;
        };
      },
    );

    return () => mm.revert();
  }, []);

  return null;
}
