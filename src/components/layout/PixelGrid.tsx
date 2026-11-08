"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

type Tool = "paint" | "erase" | "fill" | "pick";
type PaletteColor = { name: string; value: string };

type Palette = {
  id: string;
  name: string;
  colors: PaletteColor[];
};

const PALETTES: Palette[] = [
  {
    id: "kubo",
    name: "Kubo",
    colors: [
      { name: "Bone", value: "#f7f7f7" },
      { name: "Graphite", value: "#8a8a8a" },
      { name: "Cardboard", value: "#c19a6b" },
      { name: "Mustard", value: "#e3b55b" },
      { name: "Stamp", value: "#e2533d" },
      { name: "Ink", value: "#141414" },
    ],
  },
  {
    id: "sunset",
    name: "Sunset",
    colors: [
      { name: "Sand", value: "#ffb877" },
      { name: "Blush", value: "#ff8ccf" },
      { name: "Lavender", value: "#b99bff" },
      { name: "Hot Pink", value: "#ff7ad2" },
      { name: "Peach", value: "#ff9a5f" },
      { name: "Cream", value: "#ffcf9c" },
      { name: "Bone", value: "#f7f7f7" },
      { name: "Ember", value: "#ff8a3d" },
    ],
  },
  {
    id: "mono",
    name: "Mono",
    colors: [
      { name: "Black", value: "#0d0d0c" },
      { name: "Char", value: "#262626" },
      { name: "Smoke", value: "#525252" },
      { name: "Ash", value: "#8a8a8a" },
      { name: "Cloud", value: "#c7c7c7" },
      { name: "Bone", value: "#f7f7f7" },
    ],
  },
  {
    id: "neon",
    name: "Neon",
    colors: [
      { name: "Cyan", value: "#00f5ff" },
      { name: "Magenta", value: "#ff00e5" },
      { name: "Lime", value: "#aaff00" },
      { name: "Yellow", value: "#ffe600" },
      { name: "Violet", value: "#7b2fff" },
      { name: "Orange", value: "#ff3d00" },
    ],
  },
  {
    id: "earth",
    name: "Earth",
    colors: [
      { name: "Forest", value: "#2f3e2e" },
      { name: "Bark", value: "#6b4f2e" },
      { name: "Cardboard", value: "#c19a6b" },
      { name: "Mustard", value: "#e3b55b" },
      { name: "Sage", value: "#8a9a7b" },
      { name: "Sand", value: "#d9c7a5" },
    ],
  },
];

const PRESETS = [16, 24, 32, 48, 64] as const;
const HISTORY_LIMIT = 30;
const MAX_DIM = 64;
const MIN_DIM = 8;

type CellValue = string | null;

function createEmpty(w: number, h: number): CellValue[] {
  return Array(w * h).fill(null);
}

function clampDim(value: number) {
  return Math.min(MAX_DIM, Math.max(MIN_DIM, Math.round(value) || MIN_DIM));
}

function getCellFromGrid(
  gridRect: DOMRect,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const col = Math.floor(((x - gridRect.left) / gridRect.width) * width);
  const row = Math.floor(((y - gridRect.top) / gridRect.height) * height);
  if (col < 0 || col >= width || row < 0 || row >= height) return -1;
  return row * width + col;
}

function floodFill(
  cells: CellValue[],
  width: number,
  height: number,
  start: number,
  replacement: CellValue,
) {
  const target = cells[start];
  if (target === replacement) return cells;

  const next = cells.slice();
  const stack = [start];
  const visited = new Set<number>();

  while (stack.length > 0) {
    const idx = stack.pop();
    if (idx === undefined || visited.has(idx)) continue;
    if (next[idx] !== target) continue;

    visited.add(idx);
    next[idx] = replacement;

    const col = idx % width;
    const row = Math.floor(idx / width);

    if (col > 0) stack.push(idx - 1);
    if (col < width - 1) stack.push(idx + 1);
    if (row > 0) stack.push(idx - width);
    if (row < height - 1) stack.push(idx + width);
  }

  return next;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function PixelGrid({ describedBy }: { describedBy?: string }) {
  const [width, setWidth] = useState(24);
  const [height, setHeight] = useState(24);
  const [cells, setCells] = useState<CellValue[]>(() => createEmpty(24, 24));
  const [tool, setTool] = useState<Tool>("paint");
  const [paletteId, setPaletteId] = useState("kubo");
  const [customColor, setCustomColor] = useState("#ff8a3d");
  const [selectedColor, setSelectedColor] = useState<string>("#f7f7f7");
  const [background, setBackground] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [focusIndex, setFocusIndex] = useState(0);
  const [customW, setCustomW] = useState("24");
  const [customH, setCustomH] = useState("24");
  const [exportSize, setExportSize] = useState("1024");
  const [status, setStatus] = useState("Ready");
  const [history, setHistory] = useState<CellValue[][]>([]);
  const [future, setFuture] = useState<CellValue[][]>([]);

  const dragging = useRef(false);
  const strokeSnapshot = useRef<CellValue[] | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const dragRectRef = useRef<DOMRect | null>(null);
  const lastPaintRef = useRef(-1);
  const fileRef = useRef<HTMLInputElement>(null);
  const studioRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const openToolsButtonRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [toolsOpen, setToolsOpen] = useState(true);
  const [toolsMinimized, setToolsMinimized] = useState(false);
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  const palette = useMemo(
    () => PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0],
    [paletteId],
  );

  const paintedCount = useMemo(
    () => cells.filter((c) => c !== null).length,
    [cells],
  );

  const pushHistory = useCallback((snapshot: CellValue[]) => {
    setHistory((prev) => {
      const next = [...prev, snapshot];
      if (next.length > HISTORY_LIMIT) next.shift();
      return next;
    });
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setFuture((prev) => [...prev, cells]);
    setHistory((prev) => prev.slice(0, -1));
    setCells(last);
    setStatus("Undo");
  }, [history, cells]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const nextState = future[future.length - 1];
    setHistory((prev) => [...prev, cells]);
    setFuture((prev) => prev.slice(0, -1));
    setCells(nextState);
    setStatus("Redo");
  }, [future, cells]);

  const resize = useCallback(
    (newW: number, newH: number) => {
      const w = clampDim(newW);
      const h = clampDim(newH);
      pushHistory(cells);
      setCells((current) => {
        const next = createEmpty(w, h);
        const copyW = Math.min(w, width);
        const copyH = Math.min(h, height);
        for (let r = 0; r < copyH; r++) {
          for (let c = 0; c < copyW; c++) {
            next[r * w + c] = current[r * width + c];
          }
        }
        return next;
      });
      setWidth(w);
      setHeight(h);
      setCustomW(String(w));
      setCustomH(String(h));
      setFocusIndex(0);
      setStatus(`Canvas ${w} × ${h}`);
    },
    [cells, width, height, pushHistory],
  );

  const applyTool = useCallback(
    (index: number, snapshotForHistory: CellValue[] | null = null) => {
      if (tool === "pick") {
        const picked = cells[index];
        if (picked) {
          setSelectedColor(picked);
          setTool("paint");
          setStatus(`Picked ${picked}`);
        } else {
          setStatus("Picked empty cell");
        }
        return;
      }

      if (tool === "fill") {
        if (snapshotForHistory) pushHistory(snapshotForHistory);
        setCells((current) => floodFill(current, width, height, index, selectedColor));
        setStatus("Filled");
        return;
      }

      const replacement = tool === "erase" ? null : selectedColor;
      if (cells[index] === replacement) return;
      if (snapshotForHistory) pushHistory(snapshotForHistory);
      setCells((current) => {
        if (current[index] === replacement) return current;
        const next = current.slice();
        next[index] = replacement;
        return next;
      });
    },
    [cells, tool, selectedColor, width, height, pushHistory],
  );

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragRectRef.current = gridRef.current?.getBoundingClientRect() ?? null;
    const rect = dragRectRef.current;
    if (!rect) return;
    const index = getCellFromGrid(rect, event.clientX, event.clientY, width, height);
    if (index < 0) return;

    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-cell-index="${index}"]`)
      ?.focus({ preventScroll: true });
    setFocusIndex(index);
    lastPaintRef.current = index;

    if (tool === "paint" || tool === "erase") {
      dragging.current = true;
      strokeSnapshot.current = cells;
      event.currentTarget.setPointerCapture(event.pointerId);
      applyTool(index, null);
    } else {
      applyTool(index, cells);
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const rect = dragRectRef.current;
    if (!rect) return;
    const index = getCellFromGrid(rect, event.clientX, event.clientY, width, height);
    if (index < 0 || index === lastPaintRef.current) return;
    lastPaintRef.current = index;
    const replacement = tool === "erase" ? null : selectedColor;
    setCells((current) => {
      if (current[index] === replacement) return current;
      const next = current.slice();
      next[index] = replacement;
      return next;
    });
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current && strokeSnapshot.current) {
      pushHistory(strokeSnapshot.current);
    }
    dragging.current = false;
    strokeSnapshot.current = null;
    dragRectRef.current = null;
    lastPaintRef.current = -1;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }
  };

  const handleCellKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const row = Math.floor(index / width);
    const col = index % width;
    let next = index;
    let handled = true;

    switch (event.key) {
      case "ArrowLeft":
        if (col > 0) next = index - 1;
        break;
      case "ArrowRight":
        if (col < width - 1) next = index + 1;
        break;
      case "ArrowUp":
        if (row > 0) next = index - width;
        break;
      case "ArrowDown":
        if (row < height - 1) next = index + width;
        break;
      case "Home":
        next = row * width;
        break;
      case "End":
        next = row * width + width - 1;
        break;
      case "Enter":
      case " ":
        applyTool(index, cells);
        setFocusIndex(index);
        break;
      default:
        handled = false;
    }

    if (!handled) {
      // tool shortcuts
      const tag = (event.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (event.ctrlKey || event.metaKey) {
        if (event.key.toLowerCase() === "z") {
          event.preventDefault();
          if (event.shiftKey) redo();
          else undo();
          return;
        }
        if (event.key.toLowerCase() === "y") {
          event.preventDefault();
          redo();
          return;
        }
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "b") setTool("paint");
      else if (key === "e") setTool("erase");
      else if (key === "g") setTool("fill");
      else if (key === "i") setTool("pick");
      else return;
      event.preventDefault();
      return;
    }

    event.preventDefault();
    if (next === index) return;
    setFocusIndex(next);
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-cell-index="${next}"]`)
      ?.focus();
  };

  const clearCanvas = () => {
    pushHistory(cells);
    setCells(createEmpty(width, height));
    setStatus("Cleared");
  };

  const fillAll = () => {
    pushHistory(cells);
    setCells(Array(width * height).fill(selectedColor));
    setStatus("Filled all");
  };

  const exportPNG = () => {
    const target = Number(exportSize);
    const scale = Math.max(1, Math.floor(target / Math.max(width, height)));
    const outW = width * scale;
    const outH = height * scale;
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, outW, outH);
    }

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const value = cells[r * width + c];
        if (!value) continue;
        ctx.fillStyle = value;
        ctx.fillRect(c * scale, r * scale, scale, scale);
      }
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, `kubo-pixel-${width}x${height}.png`);
      setStatus(`Exported PNG ${outW}×${outH}`);
    }, "image/png");
  };

  const copyPNG = async () => {
    try {
      const target = 1024;
      const scale = Math.max(1, Math.floor(target / Math.max(width, height)));
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          const value = cells[r * width + c];
          if (!value) continue;
          ctx.fillStyle = value;
          ctx.fillRect(c * scale, r * scale, scale, scale);
        }
      }
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Export failed");
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setStatus("Copied PNG to clipboard");
    } catch {
      setStatus("Copy not supported in this browser");
    }
  };

  const exportJSON = () => {
    const payload = JSON.stringify(
      { width, height, background, cells },
      null,
      2,
    );
    const blob = new Blob([payload], { type: "application/json" });
    downloadBlob(blob, `kubo-pixel-${width}x${height}.json`);
    setStatus("Exported JSON");
  };

  const importJSON = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as {
        width?: number;
        height?: number;
        background?: string | null;
        cells?: CellValue[];
      };
      const w = clampDim(Number(data.width) || 0);
      const h = clampDim(Number(data.height) || 0);
      if (!data.cells || data.cells.length !== w * h) {
        setStatus("Import failed — invalid file");
        return;
      }
      pushHistory(cells);
      setWidth(w);
      setHeight(h);
      setCells(data.cells.slice());
      setBackground(data.background ?? null);
      setCustomW(String(w));
      setCustomH(String(h));
      setStatus(`Imported ${w} × ${h}`);
    } catch {
      setStatus("Import failed — invalid JSON");
    }
  };

  const getColorName = (value: CellValue) => {
    if (!value) return "empty";
    const hit = PALETTES.flatMap((p) => p.colors).find(
      (c) => c.value === value,
    );
    return hit ? hit.name : value;
  };

  const closeTools = useCallback(() => {
    setToolsOpen(false);
    setStatus("Tools closed");
  }, []);

  const openTools = useCallback(() => {
    setToolsOpen(true);
    setToolsMinimized(false);
  }, []);

  const handleBarPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button")) return;
    const win = windowRef.current;
    if (!win) return;
    const winRect = win.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - winRect.left,
      offsetY: event.clientY - winRect.top,
    };
    setPanelPos({ x: winRect.left, y: winRect.top });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleBarPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const win = windowRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !win) return;
    const SAFE = 12;
    const maxX = Math.max(
      SAFE,
      window.innerWidth - win.offsetWidth - SAFE,
    );
    const maxY = Math.max(
      SAFE,
      window.innerHeight - win.offsetHeight - SAFE,
    );
    const x = Math.min(maxX, Math.max(SAFE, event.clientX - drag.offsetX));
    const y = Math.min(maxY, Math.max(SAFE, event.clientY - drag.offsetY));
    setPanelPos({ x, y });
  };

  const handleBarPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div ref={studioRef} className="pixel-studio">
      <div className="pixel-panel">
        <div className="pixel-panel-head">
          <p>Canvas</p>
          <p aria-live="polite">
            {width} × {height} · {paintedCount} painted
          </p>
        </div>

        <div className="pixel-toolbar" role="toolbar" aria-label="Pixel tools">
        <button
          type="button"
          className="pixel-tool"
          aria-pressed={tool === "paint"}
          onClick={() => setTool("paint")}
          title="Paint (B)"
        >
          Paint
        </button>
        <button
          type="button"
          className="pixel-tool"
          aria-pressed={tool === "erase"}
          onClick={() => setTool("erase")}
          title="Erase (E)"
        >
          Erase
        </button>
        <button
          type="button"
          className="pixel-tool"
          aria-pressed={tool === "fill"}
          onClick={() => setTool("fill")}
          title="Fill (G)"
        >
          Fill
        </button>
        <button
          type="button"
          className="pixel-tool"
          aria-pressed={tool === "pick"}
          onClick={() => setTool("pick")}
          title="Eyedropper (I)"
        >
          Pick
        </button>
        <span className="pixel-tool-sep" aria-hidden="true" />
        <button
          type="button"
          className="pixel-tool"
          disabled={history.length === 0}
          onClick={undo}
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          type="button"
          className="pixel-tool"
          disabled={future.length === 0}
          onClick={redo}
          title="Redo (Ctrl+Shift+Z)"
        >
          Redo
        </button>
        <span className="pixel-tool-sep" aria-hidden="true" />
        <button
          type="button"
          className="pixel-tool"
          aria-pressed={showGrid}
          onClick={() => setShowGrid((v) => !v)}
        >
          Grid
        </button>
        <button
          type="button"
          className="pixel-tool"
          onClick={clearCanvas}
        >
          Clear
        </button>
      </div>

      <div
        ref={gridRef}
        className={`pixel-grid${showGrid ? "" : " is-grid-off"}`}
        role="group"
        aria-label="Pixel art grid"
        aria-describedby={describedBy}
        style={{
          gridTemplateColumns: `repeat(${width}, 1fr)`,
          gridTemplateRows: `repeat(${height}, 1fr)`,
          aspectRatio: `${width} / ${height}`,
          background: background ?? "#1a1a18",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={() => {
          dragging.current = false;
          strokeSnapshot.current = null;
        }}
      >
        {cells.map((value, index) => {
          const row = Math.floor(index / width);
          const col = index % width;
          return (
            <button
              key={index}
              type="button"
              className="pixel-cell"
              data-cell-index={index}
              aria-label={`Row ${row + 1}, column ${col + 1}, ${getColorName(value)}`}
              aria-pressed={value !== null}
              tabIndex={focusIndex === index ? 0 : -1}
              style={value ? { backgroundColor: value } : undefined}
              onClick={() => {
                setFocusIndex(index);
                if (tool !== "paint" && tool !== "erase") {
                  // fill/pick handled on pointer down; prevent double-fire
                  return;
                }
                // paint/erase single click also flows through pointer; avoid duplicate history
              }}
              onKeyDown={(event) => handleCellKeyDown(event, index)}
            />
          );
        })}
        </div>

        <p className="pixel-status" aria-live="polite">
          {status} · {tool} · {selectedColor}
        </p>

        {!toolsOpen && (
          <button
            ref={openToolsButtonRef}
            type="button"
            className="pixel-tools-toggle"
            onClick={openTools}
          >
            Tools
          </button>
        )}
      </div>

      {toolsOpen && (
        <div
          ref={windowRef}
          className={`pixel-window${toolsMinimized ? " is-minimized" : ""}`}
          role="dialog"
          aria-label="Pixel tools panel"
          style={
            panelPos
              ? { left: panelPos.x, top: panelPos.y, right: "auto" }
              : undefined
          }
        >
          <div
            className="pixel-window-bar"
            onPointerDown={handleBarPointerDown}
            onPointerMove={handleBarPointerMove}
            onPointerUp={handleBarPointerEnd}
            onPointerCancel={handleBarPointerEnd}
          >
            <span className="pixel-window-title">Pixel Tools</span>
            <span className="pixel-window-actions">
              <button
                type="button"
                className="pixel-tool pixel-window-btn"
                aria-label={toolsMinimized ? "Expand tools" : "Minimize tools"}
                aria-pressed={toolsMinimized}
                onClick={() => setToolsMinimized((v) => !v)}
              >
                {toolsMinimized ? "▢" : "—"}
              </button>
              <button
                type="button"
                className="pixel-tool pixel-window-btn"
                aria-label="Close tools"
                onClick={closeTools}
              >
                ×
              </button>
            </span>
          </div>

          {!toolsMinimized && (
            <div className="pixel-window-body">
              <div className="pixel-controls pixel-controls-top">
        <div className="pixel-field">
          <label htmlFor="pixel-palette-select">Palette</label>
          <select
            id="pixel-palette-select"
            value={paletteId}
            onChange={(event) => setPaletteId(event.target.value)}
          >
            {PALETTES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="pixel-palette" role="group" aria-label="Pixel colors">
          {palette.colors.map((color) => (
            <button
              key={color.value}
              type="button"
              className="pixel-swatch"
              style={{ backgroundColor: color.value }}
              aria-label={`${color.name} ${color.value}`}
              aria-pressed={selectedColor === color.value && tool === "paint"}
              title={`${color.name} — ${color.value}`}
              onClick={() => {
                setSelectedColor(color.value);
                setTool("paint");
              }}
            />
          ))}
        </div>

        <div className="pixel-custom">
          <input
            type="color"
            aria-label="Custom color"
            value={customColor}
            onChange={(event) => {
              setCustomColor(event.target.value);
              setSelectedColor(event.target.value);
              setTool("paint");
            }}
          />
          <input
            type="text"
            aria-label="Custom hex"
            value={customColor}
            spellCheck={false}
            onChange={(event) => {
              const value = event.target.value;
              setCustomColor(value);
              if (/^#[0-9a-fA-F]{6}$/.test(value)) {
                setSelectedColor(value);
                setTool("paint");
              }
            }}
          />
        </div>
      </div>

      <div className="pixel-controls">
        <div className="pixel-size">
          <span className="pixel-field-label" id="pixel-size-label">
            Canvas
          </span>
          <div
            className="pixel-size-presets"
            role="group"
            aria-labelledby="pixel-size-label"
          >
            {PRESETS.map((size) => (
              <button
                key={size}
                type="button"
                className="pixel-tool"
                aria-pressed={width === size && height === size}
                onClick={() => resize(size, size)}
              >
                {size}
              </button>
            ))}
          </div>
          <div className="pixel-size-custom">
            <label>
              W
              <input
                type="number"
                min={MIN_DIM}
                max={MAX_DIM}
                value={customW}
                onChange={(event) => setCustomW(event.target.value)}
                aria-label="Canvas width"
              />
            </label>
            <label>
              H
              <input
                type="number"
                min={MIN_DIM}
                max={MAX_DIM}
                value={customH}
                onChange={(event) => setCustomH(event.target.value)}
                aria-label="Canvas height"
              />
            </label>
            <button
              type="button"
              className="pixel-tool"
              onClick={() => resize(Number(customW), Number(customH))}
            >
              Apply
            </button>
          </div>
        </div>

        <div className="pixel-bg">
          <span className="pixel-field-label">Background</span>
          <div className="pixel-actions" role="group" aria-label="Canvas background">
            <button
              type="button"
              className="pixel-tool"
              aria-pressed={background === null}
              onClick={() => setBackground(null)}
            >
              Clear
            </button>
            <button
              type="button"
              className="pixel-tool"
              aria-pressed={background === "#000000"}
              onClick={() => setBackground("#000000")}
            >
              Black
            </button>
            <button
              type="button"
              className="pixel-tool"
              aria-pressed={background === "#f7f7f7"}
              onClick={() => setBackground("#f7f7f7")}
            >
              Bone
            </button>
          </div>
        </div>
      </div>

      <div className="pixel-controls pixel-export">
        <div className="pixel-field">
          <label htmlFor="pixel-export-size">PNG size</label>
          <select
            id="pixel-export-size"
            value={exportSize}
            onChange={(event) => setExportSize(event.target.value)}
          >
            <option value="512">512px</option>
            <option value="1024">1024px</option>
            <option value="2048">2048px</option>
          </select>
        </div>
        <div className="pixel-actions">
          <button type="button" className="pixel-tool" onClick={exportPNG}>
            Export PNG
          </button>
          <button type="button" className="pixel-tool" onClick={copyPNG}>
            Copy PNG
          </button>
          <button type="button" className="pixel-tool" onClick={exportJSON}>
            Export JSON
          </button>
          <button
            type="button"
            className="pixel-tool"
            onClick={() => fileRef.current?.click()}
          >
            Import JSON
          </button>
          <button type="button" className="pixel-tool" onClick={fillAll}>
            Fill all
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          aria-hidden="true"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importJSON(file);
            event.target.value = "";
          }}
        />
      </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
