"use client";

import { useMemo, useState } from "react";
import {
  PIXEL_EXPORT_SIZES,
  PIXEL_ICON_SIZE,
  buildPixelSvg,
  pixelIcons,
  type PixelExportFormat,
  type PixelExportSize,
  type PixelIcon,
} from "@/lib/pixel-icons";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function rasterize(icon: PixelIcon, size: number, color: string, type: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(null);
      return;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = color;
    const scale = size / PIXEL_ICON_SIZE;
    icon.rows.forEach((row, y) => {
      for (let x = 0; x < PIXEL_ICON_SIZE; x += 1) {
        if (row[x] === "X") {
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    });
    canvas.toBlob((blob) => resolve(blob), type);
  });
}

function PixelPreview({ icon, color }: { icon: PixelIcon; color: string }) {
  const rects = useMemo(() => {
    const out: Array<{ x: number; y: number }> = [];
    icon.rows.forEach((row, y) => {
      for (let x = 0; x < PIXEL_ICON_SIZE; x += 1) {
        if (row[x] === "X") out.push({ x, y });
      }
    });
    return out;
  }, [icon]);

  return (
    <svg
      viewBox="0 0 16 16"
      width="64"
      height="64"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <g fill={color}>
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width="1" height="1" />
        ))}
      </g>
    </svg>
  );
}

export function IconStudio() {
  const [format, setFormat] = useState<PixelExportFormat>("png");
  const [size, setSize] = useState<PixelExportSize>(64);
  const [ink, setInk] = useState<"light" | "dark">("light");
  const [status, setStatus] = useState("Ready");
  const [busy, setBusy] = useState(false);

  const inkColor = ink === "light" ? "#f7f7f7" : "#232323";

  async function exportIcon(icon: PixelIcon) {
    if (busy) return;
    setBusy(true);
    const filename = `${icon.id}-${size}px.${format}`;
    if (format === "svg") {
      downloadBlob(
        new Blob([buildPixelSvg(icon, size, inkColor)], { type: "image/svg+xml" }),
        filename,
      );
      setStatus(`Downloaded ${filename}`);
    } else {
      const blob = await rasterize(
        icon,
        size,
        inkColor,
        format === "png" ? "image/png" : "image/webp",
      );
      if (blob) {
        downloadBlob(blob, filename);
        setStatus(`Downloaded ${filename}`);
      } else {
        setStatus("Export failed in this browser");
      }
    }
    setBusy(false);
  }

  async function copySvg(icon: PixelIcon) {
    try {
      await navigator.clipboard.writeText(buildPixelSvg(icon, size, inkColor));
      setStatus(`${icon.id}.svg copied`);
    } catch {
      setStatus("Copy failed — select and copy manually");
    }
  }

  const categories = useMemo(
    () => [...new Set(pixelIcons.map((i) => i.category))],
    [],
  );

  return (
    <div className="icons-studio">
      <div className="icons-controls" data-intro>
        <div className="icons-control">
          <p className="icons-control-label">Format</p>
          <div className="icons-segment" role="group" aria-label="Export format">
            {(["svg", "png", "webp"] as PixelExportFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                aria-pressed={format === f}
                className={format === f ? "is-active" : ""}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="icons-control">
          <p className="icons-control-label">Size</p>
          <div className="icons-segment icons-segment-sizes" role="group" aria-label="Export size">
            {PIXEL_EXPORT_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={size === s ? "is-active" : ""}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="icons-control">
          <p className="icons-control-label">Ink</p>
          <div className="icons-segment" role="group" aria-label="Icon ink">
            <button
              type="button"
              onClick={() => setInk("light")}
              aria-pressed={ink === "light"}
              className={ink === "light" ? "is-active" : ""}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setInk("dark")}
              aria-pressed={ink === "dark"}
              className={ink === "dark" ? "is-active" : ""}
            >
              Dark
            </button>
          </div>
        </div>

        <p className="icons-status" aria-live="polite">
          {status} · {pixelIcons.length} icons · {size}px {format.toUpperCase()}
        </p>
      </div>

      {categories.map((category) => (
        <section key={category} className="icons-group" aria-label={category}>
          <h2 className="icons-group-title">{category}</h2>
          <ul className="icons-grid">
            {pixelIcons
              .filter((i) => i.category === category)
              .map((icon) => (
                <li key={icon.id} className="icon-card">
                  <div
                    className={`icon-preview${ink === "dark" ? " is-light-bg" : ""}`}
                  >
                    <PixelPreview icon={icon} color={inkColor} />
                  </div>
                  <div className="icon-meta">
                    <p className="icon-name">{icon.name}</p>
                    <p className="icon-id">
                      {icon.id} · 16×16 pixel · {size}px {format.toUpperCase()}
                    </p>
                  </div>
                  <div className="icon-actions">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void exportIcon(icon)}
                    >
                      Download {format.toUpperCase()}
                    </button>
                    <button type="button" onClick={() => void copySvg(icon)}>
                      Copy SVG
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}