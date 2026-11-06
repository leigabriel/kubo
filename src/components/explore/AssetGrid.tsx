"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { assets, type Asset } from "@/data/assets";

export function AssetGrid() {
  const [selected, setSelected] = useState<Asset | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    let cancelled = false;
    import("@google/model-viewer").catch(() => {
      if (!cancelled) throw new Error("Model viewer failed to load");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const close = useCallback(() => setSelected(null), []);

  useEffect(() => {
    if (!selected) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    lenis?.stop();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      lenis?.start();
    };
  }, [selected, close, lenis]);

  return (
    <>
      <div className="asset-grid" role="list">
        {assets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            role="listitem"
            className="asset-card"
            onClick={() => setSelected(asset)}
            aria-label={`Open ${asset.title}`}
          >
            <span className="asset-thumb">
              <model-viewer
                src={asset.src}
                alt={asset.title}
                camera-orbit="0deg 75deg 8m"
                interaction-prompt="none"
                shadow-intensity="0.6"
                exposure="1.05"
              />
            </span>
            <span className="asset-index">{asset.index}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="asset-modal-backdrop"
          data-lenis-prevent
          role="presentation"
          onClick={close}
        >
          <div
            className="asset-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="asset-modal-title"
            aria-describedby="asset-modal-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeRef}
              type="button"
              className="asset-modal-close"
              onClick={close}
              aria-label="Close"
            >
              ×
            </button>

            <div className="asset-modal-viewer">
              <model-viewer
                src={selected.src}
                alt={selected.title}
                camera-orbit="20deg 75deg 6m"
                camera-controls="camera-controls"
                auto-rotate
                interaction-prompt="auto"
                shadow-intensity="0.8"
                exposure="1.05"
              />
            </div>

            <div className="asset-modal-body">
              <p className="asset-modal-index">{selected.index}</p>
              <h2 id="asset-modal-title">{selected.title}</h2>
              <p id="asset-modal-desc">{selected.description}</p>

              <dl className="asset-modal-meta">
                <div>
                  <dt>Format</dt>
                  <dd>{selected.format}</dd>
                </div>
                <div>
                  <dt>File size</dt>
                  <dd>{selected.sizeMB.toFixed(1)} MB</dd>
                </div>
                <div>
                  <dt>Licence</dt>
                  <dd>Free use</dd>
                </div>
              </dl>

              <div className="asset-modal-actions">
                <a
                  className="asset-download"
                  href={selected.src}
                  download={selected.title.replace(/\s+/g, "-").toLowerCase() + ".glb"}
                >
                  Download .glb
                </a>
                <a
                  className="asset-open"
                  href={selected.src}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open raw file
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
