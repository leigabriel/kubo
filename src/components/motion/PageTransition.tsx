"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

export function PageTransition() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const firstRender = useRef(true);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      overlay.style.opacity = "0";
      overlay.style.visibility = "hidden";
      return;
    }

    if (firstRender.current) {
      firstRender.current = false;
      gsap.set(overlay, { autoAlpha: 1 });
      gsap.to(overlay, {
        autoAlpha: 0,
        duration: 0.8,
        ease: "power3.inOut",
        delay: 0.08,
      });
      return;
    }

    gsap.killTweensOf(overlay);
    gsap.set(overlay, { autoAlpha: 1 });
    gsap.to(overlay, {
      autoAlpha: 0,
      duration: 0.75,
      ease: "power3.inOut",
      delay: 0.08,
    });
  }, [pathname]);

  return (
    <div
      ref={overlayRef}
      className="page-transition"
      aria-hidden="true"
      style={{ opacity: 1 }}
    />
  );
}
