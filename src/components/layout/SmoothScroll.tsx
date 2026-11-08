"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);

function ScrollTriggerSync() {
  useLenis(() => ScrollTrigger.update(), [], 1);
  return null;
}

function useLiteMode() {
  const [lite, setLite] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const cores = navigator.hardwareConcurrency ?? 8;
    const memory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;
    const lowMemory = typeof memory === "number" && memory <= 4;
    setLite(reduced || cores <= 4 || lowMemory);
  }, []);

  return lite;
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);
  const pathname = usePathname();
  const lite = useLiteMode();

  useEffect(() => {
    if (lite) return;
    const update = (time: number) => {
      lenisRef.current?.lenis?.raf(time * 1000);
    };
    gsap.ticker.add(update);
    return () => gsap.ticker.remove(update);
  }, [lite]);

  useEffect(() => {
    if (lite) {
      window.scrollTo({ top: 0, behavior: "auto" });
      ScrollTrigger.refresh();
      return;
    }
    lenisRef.current?.lenis?.scrollTo(0, { immediate: true, force: true });
    ScrollTrigger.refresh();
  }, [pathname, lite]);

  if (lite) return <>{children}</>;

  return (
    <ReactLenis root options={{ autoRaf: false, lerp: 0.1 }} ref={lenisRef}>
      <ScrollTriggerSync />
      {children}
    </ReactLenis>
  );
}
