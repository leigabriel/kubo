"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PixelMark } from "@/components/visual/PixelMark";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function HomeSignature() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const section = sectionRef.current;
      if (!section) return;

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          once: true,
        },
      });

      tl.from(".signature-intro", {
        y: -12,
        autoAlpha: 0,
        duration: 0.6,
      })
        .from(
          ".signature-word-left",
          {
            x: -44,
            autoAlpha: 0,
            duration: 0.9,
          },
          0.05,
        )
        .from(
          ".signature-word-right",
          { x: 44, autoAlpha: 0, duration: 0.9 },
          0.1,
        )
        .from(
          ".signature-meta-bottom",
          { y: 12, autoAlpha: 0, duration: 0.6 },
          0.43,
        );

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="home-signature"
      data-header-theme="light"
      aria-labelledby="signature-title"
    >
      <h2 className="sr-only" id="signature-title">
        Kubo Archive Box
      </h2>

      <p className="signature-intro">
        Kubo is a creative digital space for discovering, organizing, and
        exploring digital assets — through a simple, immersive experience. One
        place to keep what you make and find what you need next.
      </p>

      <div className="signature-main">
        <div className="signature-word signature-word-left" aria-hidden="true">
          <PixelMark className="signature-mark" />
          <span>Kubo</span>
        </div>

        <div className="signature-stage" aria-hidden="true" />

        <div className="signature-word signature-word-right" aria-hidden="true">
          <span>Archive</span>
        </div>
      </div>

      <div className="signature-meta signature-meta-bottom">
        <div className="signature-meta-block">
          <span>Created by</span>
          <span>Lei Gabriel</span>
        </div>
        <div className="signature-meta-block signature-meta-block-end">
          <span>Free/Paid</span>
          <span>@2026</span>
        </div>
      </div>
    </section>
  );
}
