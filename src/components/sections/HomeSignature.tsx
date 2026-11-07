"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { getModelUrl } from "@/lib/storage";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const signatureModel = getModelUrl("kubo-archive-box.optimized.glb");

const markCells = [
  [0, 0],
  [3, 0],
  [6, 0],
  [1, 1],
  [3, 1],
  [5, 1],
  [2, 2],
  [3, 2],
  [4, 2],
  [0, 3],
  [1, 3],
  [2, 3],
  [3, 3],
  [4, 3],
  [5, 3],
  [6, 3],
  [2, 4],
  [3, 4],
  [4, 4],
  [1, 5],
  [3, 5],
  [5, 5],
  [0, 6],
  [3, 6],
  [6, 6],
] as const;

function PixelMark() {
  return (
    <svg
      className="signature-mark"
      viewBox="0 0 7 7"
      fill="currentColor"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {markCells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
      ))}
    </svg>
  );
}

export function HomeSignature() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    import("@google/model-viewer").catch((error) => {
      console.error("Model viewer failed to load", error);
    });
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

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

      tl.from(".signature-meta-top", {
        y: -12,
        autoAlpha: 0,
        duration: 0.6,
      })
        .from(
          ".signature-word-left",
          { x: -44, autoAlpha: 0, duration: 0.9 },
          0.05,
        )
        .from(
          ".signature-word-right",
          { x: 44, autoAlpha: 0, duration: 0.9 },
          0.05,
        )
        .from(
          ".signature-stage",
          { y: 34, autoAlpha: 0, duration: 1.05 },
          0.12,
        )
        .from(
          ".signature-meta-bottom",
          { y: 12, autoAlpha: 0, duration: 0.6 },
          0.38,
        );

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: sectionRef },
  );

  useEffect(() => {
    if (reducedMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const tilt = tiltRef.current;
    if (!tilt) return;

    const rotateX = gsap.quickTo(tilt, "rotateX", {
      duration: 0.55,
      ease: "power3.out",
    });
    const rotateY = gsap.quickTo(tilt, "rotateY", {
      duration: 0.55,
      ease: "power3.out",
    });
    const moveX = gsap.quickTo(tilt, "x", {
      duration: 0.75,
      ease: "power3.out",
    });
    const moveY = gsap.quickTo(tilt, "y", {
      duration: 0.75,
      ease: "power3.out",
    });

    const onPointerMove = (event: PointerEvent) => {
      const rect = tilt.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      rotateY(x * 6);
      rotateX(y * -6);
      moveX(x * 10);
      moveY(y * 8);
    };

    const onPointerLeave = () => {
      rotateY(0);
      rotateX(0);
      moveX(0);
      moveY(0);
    };

    tilt.addEventListener("pointermove", onPointerMove);
    tilt.addEventListener("pointerleave", onPointerLeave);

    return () => {
      tilt.removeEventListener("pointermove", onPointerMove);
      tilt.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [reducedMotion]);

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

      <div className="signature-meta signature-meta-top">
        <span>Design &amp; Created</span>
        <span>By</span>
        <span>Lei Gabriel</span>
      </div>

      <div className="signature-main">
        <div className="signature-word signature-word-left" aria-hidden="true">
          <PixelMark />
          <span>Kubo</span>
        </div>

        <div ref={stageRef} className="signature-stage">
          <div ref={tiltRef} className="signature-tilt">
            <model-viewer
              src={signatureModel}
              alt="The Kubo Archive Box"
              camera-orbit="32deg 72deg auto"
              field-of-view="30deg"
              camera-controls=""
              disable-zoom=""
              auto-rotate={reducedMotion ? undefined : ""}
              auto-rotate-delay="1600"
              rotation-per-second="10deg"
              interaction-prompt="none"
              shadow-intensity="0.65"
              shadow-softness="1"
              exposure="1.08"
              tone-mapping="aces"
              environment-image="neutral"
              loading="lazy"
            />
          </div>
        </div>

        <div className="signature-word signature-word-right" aria-hidden="true">
          <span>Archive</span>
        </div>
      </div>

      <div className="signature-meta signature-meta-bottom">
        <span>Free</span>
        <span>Paid</span>
        <span>@2026</span>
      </div>
    </section>
  );
}
