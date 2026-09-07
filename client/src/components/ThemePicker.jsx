import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../context/ThemeContext.jsx";
import SidebarHoverLabel from "./SidebarHoverLabel.jsx";
import { cn } from "../lib/tw.js";

const THEMES_EXPANDED_OPEN_KEY = "fovea.sidebar.themes.open";
const THEMES_COLLAPSED_OPEN_KEY = "fovea.sidebar.themes.collapsed.open";
const FLYOUT_WIDTH = 208;
const FLYOUT_MARGIN = 12;

function readStoredOpen(key) {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(key);
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
              "min-w-0 rounded-lg border px-1.5 py-2 text-center transition-colors",
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
            <span className="block truncate text-[10px] font-medium leading-tight text-sidebar-text">
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
    const maxHeight = Math.min(320, window.innerHeight - FLYOUT_MARGIN * 2);
    const left = Math.min(
      rect.right + FLYOUT_MARGIN,
      window.innerWidth - FLYOUT_WIDTH - FLYOUT_MARGIN,
    );

    // Grow upward from the themes control; keep the panel inside the viewport.
    let top = rect.top - 8;
    top = Math.max(FLYOUT_MARGIN, top);
    top = Math.min(top, window.innerHeight - maxHeight - FLYOUT_MARGIN);

    setCoords({ left, top, maxHeight });
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
        top: coords.top,
        left: coords.left,
        width: FLYOUT_WIDTH,
        maxHeight: coords.maxHeight,
        zIndex: 1000,
        backgroundColor: "var(--sidebar-bg)",
        color: "var(--sidebar-text)",
        borderColor: "var(--sidebar-border)",
      }}
      className="box-border overflow-hidden rounded-xl border shadow-2xl"
    >
      <div className="border-b border-sidebar-border px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">Themes</p>
      </div>
      <div className="overflow-y-auto p-2">
        <ThemePresetGrid presets={presets} themeId={themeId} setTheme={setTheme} />
      </div>
    </div>,
    document.body,
  );
}

export default function ThemePicker({ collapsed = false }) {
  const { themeId, presets, setTheme } = useTheme();
  const [expandedOpen, setExpandedOpen] = useState(() => readStoredOpen(THEMES_EXPANDED_OPEN_KEY));
  const [collapsedOpen, setCollapsedOpen] = useState(() => readStoredOpen(THEMES_COLLAPSED_OPEN_KEY));
  const activePreset = presets.find((preset) => preset.id === themeId);
  const collapsedAnchorRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(THEMES_EXPANDED_OPEN_KEY, expandedOpen ? "1" : "0");
  }, [expandedOpen]);

  useEffect(() => {
    localStorage.setItem(THEMES_COLLAPSED_OPEN_KEY, collapsedOpen ? "1" : "0");
  }, [collapsedOpen]);

  useEffect(() => {
    if (!collapsed) setCollapsedOpen(false);
  }, [collapsed]);

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
            onClick={() => setCollapsedOpen((value) => !value)}
            aria-expanded={collapsedOpen}
            className="flex h-5 w-full items-center justify-center rounded-md text-[10px] font-semibold text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text"
          >
            {collapsedOpen ? "Hide" : "Themes"}
          </button>
        </div>
        <CollapsedThemeFlyout
          open={collapsedOpen}
          anchorRef={collapsedAnchorRef}
          onClose={() => setCollapsedOpen(false)}
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
        onClick={() => setExpandedOpen((value) => !value)}
        aria-expanded={expandedOpen}
        className="flex w-full items-center justify-between rounded-md px-0.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
      >
        <span>Themes{activePreset ? ` · ${activePreset.label}` : ""}</span>
        <span aria-hidden="true">{expandedOpen ? "−" : "+"}</span>
      </button>
      {expandedOpen ? (
        <div className="mt-1.5 max-h-36 overflow-y-auto rounded-lg border border-sidebar-border bg-sidebar-surface p-1.5">
          <ThemePresetGrid presets={presets} themeId={themeId} setTheme={setTheme} />
        </div>
      ) : null}
    </div>
  );
}
