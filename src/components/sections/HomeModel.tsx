"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { loadModelViewer } from "@/lib/model-viewer";
import { getModelUrl } from "@/lib/storage";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const signatureModel = getModelUrl("kuboarchive-signature.glb");

export function HomeModel() {
  const layerRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    loadModelViewer().catch((error) => {
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

  useEffect(() => {
    if (reducedMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const tilt = tiltRef.current;
    if (!tilt) return;

    const rotateX = gsap.quickTo(tilt, "rotationX", {
      duration: 0.55,
      ease: "power3.out",
    });
    const rotateY = gsap.quickTo(tilt, "rotationY", {
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
      gsap.killTweensOf(tilt);
    };
  }, [reducedMotion]);

  useGSAP(
    () => {
      const layer = layerRef.current;
      const page = document.querySelector<HTMLElement>(".home-page");
      const hero = document.querySelector<HTMLElement>(".home-hero");
      const anchor = document.querySelector<HTMLElement>(".hero-model-anchor");
      const stage = document.querySelector<HTMLElement>(".signature-stage");

      if (!layer || !page || !hero || !anchor || !stage) return;

      let startX = 0;
      let startY = 0;
      let endX = 0;
      let endY = 0;
      let size = 1;
      let startScale = 0.5;

      const offsetTopInPage = (element: HTMLElement) => {
        let y = 0;
        let node: HTMLElement | null = element;

        while (node) {
          y += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }

        return y;
      };

      const measure = () => {
        const pageRect = page.getBoundingClientRect();
        const pageTop = offsetTopInPage(page);
        const anchorRect = anchor.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();
        const anchorTop = offsetTopInPage(anchor);
        const stageTop = offsetTopInPage(stage);

        size = Math.max(1, stageRect.width);
        startScale = Math.min(1, anchorRect.width / size);
        startX = anchorRect.left + anchorRect.width / 2 - pageRect.left;
        startY = anchorTop + anchorRect.height / 2 - pageTop;
        endX = stageRect.left + stageRect.width / 2 - pageRect.left;
        endY = stageTop + stageRect.height / 2 - pageTop;

        layer.style.width = `${size}px`;
        layer.style.height = `${size}px`;
      };

      const apply = (progress: number) => {
        const p = Math.min(1, Math.max(0, progress));
        const scale = startScale + (1 - startScale) * p;
        const x = startX + (endX - startX) * p - size / 2;
        const y = startY + (endY - startY) * p - size / 2;

        layer.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
        layer.classList.toggle("is-settled", p > 0.985);
        layer.classList.add("is-ready");
      };

      measure();

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        apply(1);
        return;
      }

      const trigger = ScrollTrigger.create({
        trigger: hero,
        start: "top top",
        endTrigger: stage,
        end: "center 60%",
        invalidateOnRefresh: true,
        onRefresh: (self) => {
          measure();
          apply(self.progress);
        },
        onUpdate: (self) => apply(self.progress),
      });

      apply(trigger.progress);

      // Re-measure once the intro animations clear their transforms and fonts settle.
      let cancelled = false;
      const refresh = () => {
        if (!cancelled) ScrollTrigger.refresh();
      };
      const timer = window.setTimeout(refresh, 1200);
      window.addEventListener("load", refresh);
      document.fonts?.ready.then(refresh, refresh);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
        window.removeEventListener("load", refresh);
        trigger.kill();
      };
    },
    { dependencies: [reducedMotion] },
  );

  return (
    <div ref={layerRef} className="home-model">
      <div ref={tiltRef} className="home-model-tilt">
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
          loading="eager"
        />
      </div>
    </div>
  );
}
