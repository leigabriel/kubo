"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { getDownloadUrl } from "@/lib/storage";

export type Wallpaper = {
  file: string;
  label: string;
  title: string;
  index: number;
  src: string;
};

const MODAL_CLOSE_MS = 200;

export function WallpaperGallery({ wallpapers }: { wallpapers: Wallpaper[] }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [selected, setSelected] = useState<Wallpaper | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const lenis = useLenis(() => {}, []);

  const closeModal = useCallback(() => {
    setIsClosing(true);
  }, []);

  useEffect(() => {
    if (!selected) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    modalRef.current
      ?.querySelector<HTMLElement>("[data-modal-close]")
      ?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;

      const items = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lenis?.stop();
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      lenis?.start();

      if (previouslyFocused && previouslyFocused !== document.body) {
        previouslyFocused.focus();
      }
    };
  }, [selected, lenis, closeModal]);

  useEffect(() => {
    if (!isClosing) return;

    const timeout = window.setTimeout(() => {
      setSelected(null);
      setIsClosing(false);
    }, MODAL_CLOSE_MS);

    return () => window.clearTimeout(timeout);
  }, [isClosing]);

  return (
    <>
      <div className="wallpaper-grid" data-reveal>
        {wallpapers.map((wallpaper, i) => (
          <button
            key={wallpaper.file}
            ref={(node) => {
              triggerRefs.current[i] = node;
            }}
            type="button"
            className="wallpaper-cell wallpaper-trigger"
            onClick={() => setSelected(wallpaper)}
            aria-haspopup="dialog"
          >
            <span className="wallpaper-index">
              {String(wallpaper.index).padStart(2, "0")}
            </span>
            <span className="wallpaper-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={wallpaper.src}
                alt={wallpaper.title}
                loading="lazy"
                decoding="async"
              />
            </span>
            <span className="wallpaper-label">
              {wallpaper.label} — {wallpaper.title}
            </span>
          </button>
        ))}
      </div>

      {selected ? (
        <div
          className={`wallpaper-modal${isClosing ? " is-closing" : ""}`}
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wallpaper-modal-title"
        >
          <button
            type="button"
            className="wallpaper-modal-backdrop"
            aria-label="Close wallpaper preview"
            tabIndex={-1}
            onClick={closeModal}
          />
          <figure className="wallpaper-modal-panel">
            <span className="wallpaper-media wallpaper-modal-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.src} alt={selected.title} decoding="async" />
            </span>
            <figcaption className="wallpaper-modal-meta">
              <span className="wallpaper-index">
                {String(selected.index).padStart(2, "0")}
              </span>
              <span className="wallpaper-modal-title" id="wallpaper-modal-title">
                {selected.title}
              </span>
              <span className="wallpaper-modal-file">{selected.file}</span>
            </figcaption>
            <div className="wallpaper-modal-actions">
              <a
                className="wallpaper-download"
                href={getDownloadUrl(selected.src, selected.file)}
                download={selected.file}
              >
                Download <span aria-hidden="true">↓</span>
              </a>
              <button
                type="button"
                className="wallpaper-close"
                data-modal-close
                onClick={closeModal}
              >
                Close ( × )
              </button>
            </div>
          </figure>
        </div>
      ) : null}
    </>
  );
}
