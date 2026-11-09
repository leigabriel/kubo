"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";

type SplitterProps = {
  /** "vertical" resizes a column width, "horizontal" resizes a row height. */
  orientation: "vertical" | "horizontal";
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  onReset?: () => void;
  /** Set when the pane grows as the pointer moves left / up. */
  invert?: boolean;
};

const KEY_STEP = 16;
const KEY_STEP_LARGE = 64;

export function Splitter({
  orientation,
  label,
  value,
  min,
  max,
  onChange,
  onReset,
  invert = false,
}: SplitterProps) {
  const drag = useRef<{ start: number; startValue: number } | null>(null);
  const clamp = (next: number) => Math.min(max, Math.max(min, Math.round(next)));
  const isVertical = orientation === "vertical";

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      start: isVertical ? event.clientX : event.clientY,
      startValue: value,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const point = isVertical ? event.clientX : event.clientY;
    const delta = (point - drag.current.start) * (invert ? -1 : 1);
    onChange(clamp(drag.current.startValue + delta));
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.current = null;
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    const grow = isVertical ? "ArrowRight" : "ArrowDown";
    const shrink = isVertical ? "ArrowLeft" : "ArrowUp";
    const sign = invert ? -1 : 1;

    if (event.key === grow) onChange(clamp(value + step * sign));
    else if (event.key === shrink) onChange(clamp(value - step * sign));
    else if (event.key === "Home") onChange(min);
    else if (event.key === "End") onChange(max);
    else if (event.key === "Enter" && onReset) onReset();
    else return;
    event.preventDefault();
  }

  return (
    <div
      className={`vs-sash vs-sash--${orientation}`}
      role="separator"
      aria-orientation={orientation}
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      onDoubleClick={onReset}
    />
  );
}
