"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function AboutMotion() {
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const isDesktop = window.matchMedia("(min-width: 701px)").matches;

    const intro = gsap.timeline({ defaults: { ease: "power4.out" } });

    intro
      .from(".about-kicker", {
        x: -16,
        autoAlpha: 0,
        duration: 0.7,
      })
      .from(
        ".about-hero-word",
        {
          clipPath: "inset(0 0 100% 0)",
          yPercent: 14,
          duration: 1.2,
        },
        0.05,
      )
      .from(
        ".about-rule",
        {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 0.9,
          ease: "power2.inOut",
        },
        0.35,
      )
      .from(
        ".about-hero-sub",
        {
          y: 18,
          autoAlpha: 0,
          duration: 0.8,
        },
        0.45,
      );

    gsap.utils.toArray<HTMLElement>(".about-col").forEach((col, index) => {
      gsap.from(col, {
        x: isDesktop ? [0, 34, -22][index % 3] : 0,
        y: isDesktop ? [46, 26, 58][index % 3] : 28,
        rotate: isDesktop ? [0, 0.8, -0.4][index % 3] : 0,
        autoAlpha: 0,
        duration: 0.95,
        ease: "power3.out",
        scrollTrigger: {
          trigger: col,
          start: "top 84%",
          once: true,
        },
      });
    });

    gsap.fromTo(
      ".about-capability",
      { opacity: 0.16 },
      {
        opacity: 1,
        stagger: 0.08,
        ease: "none",
        scrollTrigger: {
          trigger: ".about-services",
          start: "top 72%",
          end: "bottom 55%",
          scrub: 0.8,
        },
      },
    );

    gsap.from(".about-note", {
      xPercent: isDesktop ? 18 : 0,
      y: isDesktop ? 0 : 24,
      autoAlpha: 0,
      clipPath: isDesktop ? "inset(0 0 0 100%)" : "inset(0 0 100% 0)",
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".about-note",
        start: "top 88%",
        once: true,
      },
    });

    gsap.from(".about-value", {
      x: isDesktop ? (index) => [-18, 16, -10, 12][index % 4] : 0,
      y: (index) => [44, 72, 32, 58][index % 4],
      rotate: isDesktop ? (index) => [-1.2, 1.1, -0.6, 0.8][index % 4] : 0,
      autoAlpha: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.12,
      scrollTrigger: {
        trigger: ".about-values-grid",
        start: "top 82%",
        once: true,
      },
    });

    gsap.from(".site-footer", {
      clipPath: "inset(0 0 100% 0)",
      y: 36,
      autoAlpha: 0,
      duration: 1.1,
      ease: "power4.out",
      scrollTrigger: {
        trigger: ".site-footer",
        start: "top 90%",
        once: true,
      },
    });
  });

  return null;
}
