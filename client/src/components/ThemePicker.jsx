import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../context/ThemeContext.jsx";
import SidebarHoverLabel from "./SidebarHoverLabel.jsx";
import { cn } from "../lib/tw.js";

const THEMES_OPEN_KEY = "fovea.sidebar.themes.open";

function readThemesOpen() {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(THEMES_OPEN_KEY);
  if (stored === null) return false;
  return stored === "1";
}

function ThemePresetGrid({ presets, themeId, setTheme, className = "" }) {
  return (
    <div className={cn("grid grid-cols-2 gap-1.5", className)}>
      {presets.map((preset) => {
        const active = themeId === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => setTheme(preset.id)}
            aria-pressed={active}
            className={cn(
              "rounded-lg border px-1.5 py-2 text-center transition-colors",
              active
                ? "border-sidebar-accent bg-sidebar-hover"
                : "border-sidebar-border bg-sidebar-surface hover:border-sidebar-accent/30 hover:bg-sidebar-hover",
            )}
          >
            <span
              className="mx-auto mb-1.5 block h-5 w-5 rounded-full border border-white/20"
              style={{ background: preset.palette.swatch }}
              aria-hidden="true"
            />
            <span className="block text-[10px] font-medium leading-tight text-sidebar-text">
              {preset.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CollapsedThemeFlyout({ open, anchorRef, onClose, presets, themeId, setTheme }) {
  const panelRef = useRef(null);
  const [coords, setCoords] = useState(null);

  const updateCoords = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const panelWidth = 188;
    const margin = 10;
    const left = rect.right + margin;
    const maxBottom = window.innerHeight - margin;

    setCoords({
      left: Math.min(left, window.innerWidth - panelWidth - margin),
      bottom: Math.min(maxBottom, window.innerHeight - rect.bottom),
    });
  }, [anchorRef]);

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
    if (!open) return undefined;

    let removeListeners = null;
    const timer = window.setTimeout(() => {
      const onPointerDown = (event) => {
        const anchor = anchorRef.current;
        const panel = panelRef.current;
        if (anchor?.contains(event.target) || panel?.contains(event.target)) return;
        onClose();
      };

      const onKeyDown = (event) => {
        if (event.key === "Escape") onClose();
      };

      document.addEventListener("pointerdown", onPointerDown);
      document.addEventListener("keydown", onKeyDown);
      removeListeners = () => {
        document.removeEventListener("pointerdown", onPointerDown);
        document.removeEventListener("keydown", onKeyDown);
      };
    }, 0);

    return () => {
      window.clearTimeout(timer);
      removeListeners?.();
    };
  }, [open, onClose, anchorRef]);

  if (!open || !coords) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Choose theme"
      style={{
        position: "fixed",
        left: coords.left,
        bottom: coords.bottom,
        zIndex: 1000,
        width: "11.75rem",
        backgroundColor: "var(--sidebar-bg)",
        color: "var(--sidebar-text)",
        borderColor: "var(--sidebar-border)",
      }}
      className="rounded-xl border p-2 shadow-2xl"
    >
      <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
        Themes
      </p>
      <ThemePresetGrid
        presets={presets}
        themeId={themeId}
        setTheme={setTheme}
        className="max-h-[min(24rem,60vh)] overflow-y-auto pr-0.5"
      />
    </div>,
    document.body,
  );
}

export default function ThemePicker({ collapsed = false }) {
  const { themeId, presets, setTheme } = useTheme();
  const [open, setOpen] = useState(readThemesOpen);
  const activePreset = presets.find((preset) => preset.id === themeId);
  const collapsedAnchorRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(THEMES_OPEN_KEY, open ? "1" : "0");
  }, [open]);

  if (collapsed) {
    return (
      <div className="shrink-0 border-t border-sidebar-border px-2 py-2">
        <div ref={collapsedAnchorRef} className="flex flex-col items-center gap-1">
          <div className="group relative">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full border border-sidebar-accent ring-2 ring-sidebar-accent/25"
              style={{ background: activePreset?.palette.swatch }}
              aria-hidden="true"
            />
            <SidebarHoverLabel label="Themes" meta={activePreset?.label} />
          </div>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="flex h-5 w-full items-center justify-center rounded-md text-[10px] font-semibold text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text"
          >
            {open ? "Hide" : "Themes"}
          </button>
        </div>
        <CollapsedThemeFlyout
          open={open}
          anchorRef={collapsedAnchorRef}
          onClose={() => setOpen(false)}
          presets={presets}
          themeId={themeId}
          setTheme={setTheme}
        />
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-sidebar-border px-3 py-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-md px-0.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
      >
        <span>Themes{activePreset ? ` · ${activePreset.label}` : ""}</span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <ThemePresetGrid
          presets={presets}
          themeId={themeId}
          setTheme={setTheme}
          className="mt-1.5 max-h-36 pr-0.5"
        />
      ) : null}
    </div>
  );
}
