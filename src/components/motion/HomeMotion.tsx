"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function HomeMotion() {
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const hero = document.querySelector<HTMLElement>(".home-hero");
    const archive = document.querySelector<HTMLElement>(".home-archive");
    const footer = document.querySelector<HTMLElement>(".site-footer");

    if (hero) {
      gsap.to(".hero-tech", {
        autoAlpha: 0.15,
        yPercent: -6,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
        },
      });
    }

    if (archive) {
      gsap.to(".archive-mark", {
        yPercent: -10,
        rotation: -3,
        ease: "none",
        scrollTrigger: {
          trigger: archive,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.8,
        },
      });
    }

    if (footer) {
      gsap.from(".site-footer-wordmark", {
        yPercent: 12,
        autoAlpha: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: footer,
          start: "top 82%",
          once: true,
        },
      });
    }
  });

  return null;
}
