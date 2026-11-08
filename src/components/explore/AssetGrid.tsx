"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
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
import { loadModelViewer } from "@/lib/model-viewer";

gsap.registerPlugin(useGSAP);

type ExploreView = "grid" | "gallery" | "list";

const views: { id: ExploreView; label: string }[] = [
  { id: "grid", label: "Grid" },
  { id: "gallery", label: "Gallery" },
  { id: "list", label: "List" },
];

const MODAL_CLOSE_DURATION = 200;

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
  const [view, setView] = useState<ExploreView>("gallery");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [fullView, setFullView] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewerKey, setViewerKey] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const collectionRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    loadModelViewer().catch((error) => {
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

  const open = useCallback((asset: Asset, trigger?: HTMLElement) => {
    triggerRef.current = trigger ?? null;

    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }

    setIsClosing(false);
    setFullView(false);
    setAutoRotate(true);
    setViewerKey(0);
    setSelected(asset);
  }, []);

  const close = useCallback(() => {
    if (closeTimer.current !== null) return;

    setIsClosing(true);
    closeTimer.current = window.setTimeout(() => {
      setSelected(null);
      setIsClosing(false);
      closeTimer.current = null;
    }, MODAL_CLOSE_DURATION);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected, close]);

  useEffect(() => {
    if (!selected && triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [selected]);

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
                onClick={() => {
                  setPreviewId(null);
                  setView(item.id);
                }}
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
              onClick={(event) => open(asset, event.currentTarget)}
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
              onClick={(event) => open(asset, event.currentTarget)}
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
              onClick={(event) => open(asset, event.currentTarget)}
              onPointerEnter={(event) => {
                if (event.pointerType !== "touch") setPreviewId(asset.id);
              }}
              onPointerLeave={() =>
                setPreviewId((current) =>
                  current === asset.id ? null : current,
                )
              }
              onFocus={() => setPreviewId(asset.id)}
              onBlur={() =>
                setPreviewId((current) =>
                  current === asset.id ? null : current,
                )
              }
              aria-label={`Open ${asset.title}`}
            >
              <span className="asset-row-index">
                <span className="asset-row-index-label">{asset.index}</span>
                {previewId === asset.id && (
                  <span className="asset-row-preview" aria-hidden="true">
                    <model-viewer
                      src={getAssetUrl(asset)}
                      alt=""
                      camera-orbit="20deg 75deg auto"
                      interaction-prompt="none"
                      loading="eager"
                      auto-rotate
                      auto-rotate-delay="0"
                      rotation-per-second="35deg"
                      shadow-intensity="0.6"
                      exposure="1.05"
                    />
                  </span>
                )}
              </span>
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
          className={`asset-modal-backdrop${isClosing ? " is-closing" : ""}`}
          data-lenis-prevent
          role="presentation"
          onClick={close}
        >
          <div
            className={`asset-modal${isClosing ? " is-closing" : ""}${fullView ? " is-fullview" : ""}`}
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
                key={viewerKey}
                src={getAssetUrl(selected)}
                alt={selected.title}
                camera-orbit="20deg 75deg auto"
                camera-controls="camera-controls"
                auto-rotate={autoRotate ? "" : undefined}
                auto-rotate-delay="0"
                rotation-per-second="28deg"
                interaction-prompt="auto"
                shadow-intensity="0.8"
                shadow-softness="1"
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
                {fullView ? (
                  <>
                    <button
                      type="button"
                      className="asset-tool"
                      onClick={() => setViewerKey((key) => key + 1)}
                    >
                      Reset view
                    </button>
                    <button
                      type="button"
                      className="asset-tool"
                      aria-pressed={autoRotate}
                      onClick={() => setAutoRotate((value) => !value)}
                    >
                      Auto-rotate
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className="asset-tool"
                  aria-pressed={fullView}
                  onClick={() => setFullView((value) => !value)}
                >
                  {fullView ? "Exit full view" : "Full view"}
                </button>
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
