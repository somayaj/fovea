import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../lib/tw.js";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Drag a polaroid within a positioned container (coords are 0–1 from center anchor). */
export default function DraggablePolaroid({
  id,
  position,
  onPositionChange,
  onDragEnd,
  containerRef,
  className = "",
  style,
  children,
}) {
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const updatePosition = useCallback(
    (clientX, clientY) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = clamp((clientX - rect.left - dragOffset.current.x) / rect.width, 0.1, 0.9);
      const y = clamp((clientY - rect.top - dragOffset.current.y) / rect.height, 0.1, 0.9);
      onPositionChange(id, { x, y });
    },
    [containerRef, id, onPositionChange],
  );

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    dragOffset.current = {
      x: event.clientX - rect.left - position.x * rect.width,
      y: event.clientY - rect.top - position.y * rect.height,
    };

    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePosition(event.clientX, event.clientY);
  };

  const onPointerMove = (event) => {
    if (!dragging) return;
    updatePosition(event.clientX, event.clientY);
  };

  const onPointerUp = (event) => {
    if (!dragging) return;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
    onDragEnd?.(id);
  };

  useEffect(() => {
    if (!dragging) return;
    const stop = () => setDragging(false);
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, [dragging]);

  return (
    <div
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 touch-none select-none",
        dragging ? "z-50 cursor-grabbing" : "cursor-grab",
        className,
      )}
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        transition: dragging ? "none" : "left 0.22s ease, top 0.22s ease",
        ...style,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className={cn("shrink-0", dragging && "drop-shadow-lg")}>{children}</div>
    </div>
  );
}
