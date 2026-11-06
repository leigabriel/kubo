"use client";

import { useEffect, useRef, type ReactNode } from "react";
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

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);
  const pathname = usePathname();

  useEffect(() => {
    const update = (time: number) => {
      lenisRef.current?.lenis?.raf(time * 1000);
    };
    gsap.ticker.add(update);
    return () => gsap.ticker.remove(update);
  }, []);

  useEffect(() => {
    lenisRef.current?.lenis?.scrollTo(0, { immediate: true, force: true });
    ScrollTrigger.refresh();
  }, [pathname]);

  return (
    <ReactLenis root options={{ autoRaf: false, lerp: 0.1 }} ref={lenisRef}>
      <ScrollTriggerSync />
      {children}
    </ReactLenis>
  );
}
