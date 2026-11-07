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

  });

  return null;
}
