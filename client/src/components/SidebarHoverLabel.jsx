import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/tw.js";

/** Flyout label to the right of collapsed sidebar icons — portaled so it isn't clipped. */
export default function SidebarHoverLabel({ label, meta, show = true }) {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);

  const updateCoords = useCallback(() => {
    const host = anchorRef.current?.parentElement;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    setCoords({
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updateCoords();
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    const host = anchorRef.current?.parentElement;
    if (!host || !show || !label) return;

    const showTip = () => {
      updateCoords();
      setOpen(true);
    };
    const hideTip = () => setOpen(false);

    host.addEventListener("mouseenter", showTip);
    host.addEventListener("mouseleave", hideTip);
    host.addEventListener("focusin", showTip);
    host.addEventListener("focusout", hideTip);

    return () => {
      host.removeEventListener("mouseenter", showTip);
      host.removeEventListener("mouseleave", hideTip);
      host.removeEventListener("focusin", showTip);
      host.removeEventListener("focusout", hideTip);
    };
  }, [show, label, updateCoords]);

  if (!show || !label) return null;

  return (
    <>
      <span ref={anchorRef} className="sr-only" aria-hidden="true" />
      {open && coords
        ? createPortal(
            <span
              role="tooltip"
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                transform: "translateY(-50%)",
                zIndex: 200,
              }}
              className={cn(
                "pointer-events-none whitespace-nowrap rounded-lg border border-stone-700/20 bg-stone-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg",
              )}
            >
              {label}
              {meta ? <span className="ml-1.5 font-normal text-white/65">{meta}</span> : null}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
