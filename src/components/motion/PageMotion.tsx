"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function PageMotion() {
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

    intro.from(".site-header", {
      y: -12,
      autoAlpha: 0,
      duration: 0.7,
      clearProps: "transform,opacity,visibility",
    });

    const introItems = gsap.utils.toArray<HTMLElement>("[data-intro]");
    if (introItems.length > 0) {
      intro.from(
        introItems,
        {
          y: 28,
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.09,
          clearProps: "transform,opacity,visibility",
        },
        0.1,
      );
    }

    gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
      gsap.from(element, {
        y: 28,
        autoAlpha: 0,
        duration: 0.9,
        ease: "power3.out",
        clearProps: "transform,opacity,visibility",
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          once: true,
        },
      });
    });

    gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
      gsap.from(group.children, {
        y: 24,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.07,
        clearProps: "transform,opacity,visibility",
        scrollTrigger: {
          trigger: group,
          start: "top 85%",
          once: true,
        },
      });
    });

    const capabilities = document.querySelector(".about-capabilities");
    if (capabilities) {
      gsap.fromTo(
        capabilities,
        { yPercent: 8 },
        {
          yPercent: -8,
          ease: "none",
          scrollTrigger: {
            trigger: ".about-services",
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        },
      );
    }

    const cards = gsap.utils.toArray<HTMLElement>(".asset-card");
    if (cards.length > 0) {
      gsap.set(cards, { autoAlpha: 0, y: 24 });
      ScrollTrigger.batch(cards, {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.05,
            overwrite: true,
          }),
      });
    }
  });

  return null;
}
