"use client";

import { useEffect, useRef, useState } from "react";
import { loadModelViewer } from "@/lib/model-viewer";
import { CloseIcon, DownloadIcon, RefreshIcon } from "./icons";

type ViewerElement = HTMLElement;
type Status = "loading" | "ready" | "error";

function PreviewStage({ src, onRetry }: { src: string; onRetry: () => void }) {
  const viewerRef = useRef<ViewerElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadModelViewer().catch((error) => {
      console.error("Model viewer failed to load", error);
      if (!cancelled) setStatus("error");
    });

    const viewer = viewerRef.current;
    if (!viewer) {
      return () => {
        cancelled = true;
      };
    }

    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<{ totalProgress?: number }>).detail;
      setProgress(Math.round((detail?.totalProgress ?? 0) * 100));
    };
    const onLoad = () => setStatus("ready");
    const onError = () => setStatus("error");

    viewer.addEventListener("progress", onProgress);
    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);
    return () => {
      cancelled = true;
      viewer.removeEventListener("progress", onProgress);
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
    };
  }, []);

  return (
    <div className="vs-preview-stage">
      <model-viewer
        ref={viewerRef}
        src={src}
        alt="Kubo disc sleeve"
        camera-orbit="0deg 90deg auto"
        field-of-view="30deg"
        camera-controls
        disable-zoom
        auto-rotate
        auto-rotate-delay="1200"
        rotation-per-second="10deg"
        interaction-prompt="none"
        shadow-intensity="0.7"
        shadow-softness="1"
        exposure="1.05"
        tone-mapping="aces"
        environment-image="neutral"
        loading="eager"
      />
      {status === "loading" ? (
        <div className="vs-preview-overlay" role="status">
          <div className="vs-progress" aria-hidden="true">
            <span style={{ width: `${Math.max(6, progress)}%` }} />
          </div>
          <p>Loading model… {progress > 0 ? `${progress}%` : ""}</p>
        </div>
      ) : null}
      {status === "error" ? (
        <div className="vs-preview-overlay is-error" role="alert">
          <p className="vs-preview-error-title">Could not load the 3D model.</p>
          <p className="vs-preview-error-hint">
            Check that the GLB exists at the configured Supabase bucket or in
            public/models.
          </p>
          <button type="button" className="vs-btn" onClick={onRetry}>
            <RefreshIcon /> Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}

type ModelPreviewProps = {
  src: string;
  onDownload: () => void;
  onClose: () => void;
};

export function ModelPreview({ src, onDownload, onClose }: ModelPreviewProps) {
  const [attempt, setAttempt] = useState(0);

  return (
    <>
      <div className="vs-pane-head">
        <h2 className="vs-pane-title">Preview</h2>
        <div className="vs-toolbar">
          <button
            type="button"
            className="vs-icon-btn"
            aria-label="Download .glb model"
            title="Download .glb model"
            onClick={onDownload}
          >
            <DownloadIcon />
          </button>
          <button
            type="button"
            className="vs-icon-btn"
            aria-label="Hide preview"
            title="Hide preview"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      <PreviewStage
        key={attempt}
        src={src}
        onRetry={() => setAttempt((value) => value + 1)}
      />
      <p className="vs-preview-note">Drag to orbit · Kubo Disc Sleeve</p>
    </>
  );
}
