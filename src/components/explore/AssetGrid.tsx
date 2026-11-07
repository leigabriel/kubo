"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  assets,
  fetchAssets,
  getAssetDownloadUrl,
  getAssetFilename,
  getAssetUrl,
  type Asset,
} from "@/data/assets";

gsap.registerPlugin(useGSAP);

type ExploreView = "grid" | "gallery" | "list";

const views: { id: ExploreView; label: string }[] = [
  { id: "grid", label: "Grid" },
  { id: "gallery", label: "Gallery" },
  { id: "list", label: "List" },
];

function AssetThumb({ asset }: { asset: Asset }) {
  return (
    <span className="asset-thumb">
      <model-viewer
        src={getAssetUrl(asset)}
        alt={asset.title}
        camera-orbit="0deg 75deg auto"
        interaction-prompt="none"
        loading="lazy"
        shadow-intensity="0.6"
        exposure="1.05"
      />
    </span>
  );
}

export function AssetGrid() {
  const [items, setItems] = useState<Asset[]>(assets);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ExploreView>("grid");
  const [selected, setSelected] = useState<Asset | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const collectionRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    import("@google/model-viewer").catch((error) => {
      console.error("Model viewer failed to load", error);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchAssets()
      .then((remoteAssets) => {
        if (!cancelled && remoteAssets) {
          setItems(remoteAssets);
        }
      })
      .catch((error) => {
        console.error("Could not load assets from Supabase", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      if (!collectionRef.current) return;

      const targets = gsap.utils.toArray<HTMLElement>(
        "[data-asset-item]",
        collectionRef.current,
      );

      if (targets.length === 0) return;

      gsap.fromTo(
        targets,
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.045,
          ease: "power2.out",
          overwrite: true,
        },
      );
    },
    { dependencies: [items, view], scope: collectionRef },
  );

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

  const emptyState =
    loading && items.length === 0 ? (
      <p className="asset-empty">Loading assets…</p>
    ) : !loading && items.length === 0 ? (
      <p className="asset-empty">
        No assets yet. Add a row to the Supabase assets table.
      </p>
    ) : null;

  return (
    <>
      <div className="explore-subnav" data-intro aria-label="Collection views">
        <span className="explore-subnav-links">
          {views.map((item, index) => (
            <Fragment key={item.id}>
              {index > 0 && (
                <span className="explore-subnav-separator" aria-hidden="true">
                  {" / "}
                </span>
              )}
              <button
                type="button"
                aria-pressed={view === item.id}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            </Fragment>
          ))}
        </span>
      </div>

      {view === "grid" && (
        <div className="asset-grid" ref={collectionRef}>
          {items.map((asset) => (
            <button
              key={asset.id}
              type="button"
              className="asset-card"
              data-asset-item
              onClick={() => setSelected(asset)}
              aria-label={`Open ${asset.title}`}
            >
              <AssetThumb asset={asset} />
              <span className="asset-index">{asset.index}</span>
            </button>
          ))}
          {emptyState}
        </div>
      )}

      {view === "gallery" && (
        <div className="asset-gallery" ref={collectionRef}>
          {items.map((asset) => (
            <button
              key={asset.id}
              type="button"
              className="asset-gallery-item"
              data-asset-item
              onClick={() => setSelected(asset)}
              aria-label={`Open ${asset.title}`}
            >
              <AssetThumb asset={asset} />
              <span className="asset-gallery-copy">
                <span className="asset-gallery-heading">
                  <span className="asset-gallery-index">{asset.index}</span>
                  <span className="asset-gallery-title">{asset.title}</span>
                </span>
                <span className="asset-gallery-meta">
                  {asset.format} · {asset.sizeMB.toFixed(1)} MB
                </span>
              </span>
            </button>
          ))}
          {emptyState}
        </div>
      )}

      {view === "list" && (
        <div className="asset-list" ref={collectionRef}>
          {items.map((asset) => (
            <button
              key={asset.id}
              type="button"
              className="asset-row"
              data-asset-item
              onClick={() => setSelected(asset)}
              aria-label={`Open ${asset.title}`}
            >
              <span className="asset-row-index">{asset.index}</span>
              <span className="asset-row-title">{asset.title}</span>
              <span className="asset-row-meta">
                {asset.format} · {asset.sizeMB.toFixed(1)} MB
              </span>
              <span className="asset-row-arrow" aria-hidden="true">
                →
              </span>
            </button>
          ))}
          {emptyState}
        </div>
      )}

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
                src={getAssetUrl(selected)}
                alt={selected.title}
                camera-orbit="20deg 75deg auto"
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
                  href={getAssetDownloadUrl(selected)}
                  download={getAssetFilename(selected)}
                >
                  Download {selected.format || "file"}
                </a>
                <a
                  className="asset-open"
                  href={getAssetUrl(selected)}
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
