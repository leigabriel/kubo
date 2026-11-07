"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { loadModelViewer } from "@/lib/model-viewer";
import { getModelUrl } from "@/lib/storage";

const archiveBoxModel = getModelUrl("kubo-archive-box.optimized.glb");

export function AboutArchiveBox() {
  const archiveBoxRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLButtonElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const [isBack, setIsBack] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
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
    const footer = document.querySelector<HTMLElement>(".site-footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterVisible(entry.isIntersecting),
      { rootMargin: "0px 0px -64px 0px" },
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isFooterVisible && document.activeElement === archiveBoxRef.current) {
      archiveBoxRef.current?.blur();
    }
  }, [isFooterVisible]);

  useEffect(() => {
    if (isBack) restoreRef.current?.focus();
  }, [isBack]);

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const cursor = cursorRef.current;
    if (!cursor) return;

    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  }

  function bringToFront() {
    setIsBack(false);
    requestAnimationFrame(() => archiveBoxRef.current?.focus());
  }

  return (
    <>
      <button
        ref={archiveBoxRef}
        type="button"
        className={`about-archive-box${isBack ? " is-back" : ""}${
          isFooterVisible ? " is-hidden" : ""
        }`}
        onClick={() => setIsBack(true)}
        onPointerMove={handlePointerMove}
        tabIndex={isBack || isFooterVisible ? -1 : 0}
        aria-hidden={isBack || isFooterVisible ? true : undefined}
        aria-label="Send the archive box to the back layer"
      >
        <model-viewer
          src={archiveBoxModel}
          alt=""
          auto-rotate={reducedMotion || isFooterVisible ? undefined : ""}
          auto-rotate-delay="0"
          rotation-per-second="10deg"
          camera-orbit="32deg 72deg auto"
          field-of-view="30deg"
          interaction-prompt="none"
          shadow-intensity="0.65"
          shadow-softness="1"
          exposure="1.08"
          tone-mapping="aces"
          environment-image="neutral"
          loading="eager"
          reveal="auto"
        />
      </button>

      <span
        ref={cursorRef}
        className="about-archive-box-cursor"
        aria-hidden="true"
      >
        Send to back <span aria-hidden="true">↓</span>
      </span>

      {isBack && !isFooterVisible && (
        <button
          ref={restoreRef}
          type="button"
          className="about-archive-box-restore"
          onClick={bringToFront}
        >
          Bring archive box forward <span aria-hidden="true">↑</span>
        </button>
      )}
    </>
  );
}
