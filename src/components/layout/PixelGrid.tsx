"use client";

import {
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

const GRID_SIZE = 24;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;

const COLORS = [
  { name: "Bone", value: "#f7f7f7" },
  { name: "Graphite", value: "#8a8a8a" },
  { name: "Cardboard", value: "#c19a6b" },
  { name: "Mustard", value: "#e3b55b" },
  { name: "Stamp", value: "#e2533d" },
] as const;

type ColorValue = (typeof COLORS)[number]["value"];
type CellValue = ColorValue | null;

function createEmptyGrid(): CellValue[] {
  return Array<CellValue>(CELL_COUNT).fill(null);
}

function getColorName(value: CellValue) {
  if (!value) return "empty";
  return COLORS.find((color) => color.value === value)?.name ?? "painted";
}

function getCellAtPoint(x: number, y: number) {
  const element = document.elementFromPoint(x, y);
  return element?.closest<HTMLButtonElement>("[data-cell-index]") ?? null;
}

export function PixelGrid({ describedBy }: { describedBy?: string }) {
  const [cells, setCells] = useState<CellValue[]>(createEmptyGrid);
  const [selectedColor, setSelectedColor] = useState<CellValue>(COLORS[0].value);
  const [focusIndex, setFocusIndex] = useState(0);
  const dragging = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const paint = (index: number) => {
    setCells((current) => {
      if (current[index] === selectedColor) return current;

      const next = current.slice();
      next[index] = selectedColor;
      return next;
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);

    const cell = getCellAtPoint(event.clientX, event.clientY);
    if (!cell) return;

    const index = Number(cell.dataset.cellIndex);
    if (!Number.isInteger(index)) return;

    cell.focus({ preventScroll: true });
    setFocusIndex(index);
    paint(index);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;

    const cell = getCellAtPoint(event.clientX, event.clientY);
    if (!cell) return;

    const index = Number(cell.dataset.cellIndex);
    if (Number.isInteger(index)) paint(index);
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleCellKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const row = Math.floor(index / GRID_SIZE);
    const column = index % GRID_SIZE;
    let next = index;

    switch (event.key) {
      case "ArrowLeft":
        if (column > 0) next = index - 1;
        break;
      case "ArrowRight":
        if (column < GRID_SIZE - 1) next = index + 1;
        break;
      case "ArrowUp":
        if (row > 0) next = index - GRID_SIZE;
        break;
      case "ArrowDown":
        if (row < GRID_SIZE - 1) next = index + GRID_SIZE;
        break;
      case "Home":
        next = row * GRID_SIZE;
        break;
      case "End":
        next = row * GRID_SIZE + GRID_SIZE - 1;
        break;
      default:
        return;
    }

    event.preventDefault();

    if (next === index) return;

    setFocusIndex(next);
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-cell-index="${next}"]`)
      ?.focus();
  };

  return (
    <div className="pixel-panel">
      <div className="pixel-panel-head">
        <p>Canvas</p>
        <p>
          {GRID_SIZE} × {GRID_SIZE}
        </p>
      </div>

      <div
        ref={gridRef}
        className="pixel-grid"
        role="group"
        aria-label="Pixel art grid"
        aria-describedby={describedBy}
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={() => {
          dragging.current = false;
        }}
      >
        {cells.map((value, index) => {
          const row = Math.floor(index / GRID_SIZE);
          const column = index % GRID_SIZE;

          return (
            <button
              key={index}
              type="button"
              className="pixel-cell"
              data-cell-index={index}
              aria-label={`Row ${row + 1}, column ${column + 1}, ${getColorName(value)}`}
              aria-pressed={value !== null}
              tabIndex={focusIndex === index ? 0 : -1}
              style={value ? { backgroundColor: value } : undefined}
              onClick={() => {
                setFocusIndex(index);
                paint(index);
              }}
              onKeyDown={(event) => handleCellKeyDown(event, index)}
            />
          );
        })}
      </div>

      <div className="pixel-controls">
        <div className="pixel-palette" role="group" aria-label="Pixel colors">
          {COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              className="pixel-swatch"
              style={{ backgroundColor: color.value }}
              aria-label={color.name}
              aria-pressed={selectedColor === color.value}
              onClick={() => setSelectedColor(color.value)}
            />
          ))}
        </div>

        <div className="pixel-actions">
          <button
            type="button"
            className="pixel-tool"
            aria-pressed={selectedColor === null}
            onClick={() => setSelectedColor(null)}
          >
            Erase
          </button>
          <button
            type="button"
            className="pixel-tool"
            onClick={() => setCells(createEmptyGrid())}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
