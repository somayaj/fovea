import { useEffect, useState } from "react";
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

export default function ThemePicker({ collapsed = false }) {
  const { themeId, presets, setTheme } = useTheme();
  const [open, setOpen] = useState(readThemesOpen);
  const activePreset = presets.find((preset) => preset.id === themeId);

  useEffect(() => {
    localStorage.setItem(THEMES_OPEN_KEY, open ? "1" : "0");
  }, [open]);

  if (collapsed) {
    return (
      <div className="shrink-0 border-t border-sidebar-border px-2 py-2">
        <div className="flex flex-col items-center gap-1.5">
          {presets.map((preset) => {
            const active = themeId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setTheme(preset.id)}
                aria-label={`${preset.label} colors`}
                aria-pressed={active}
                className={cn(
                  "group relative flex h-7 w-7 items-center justify-center rounded-full border transition-transform",
                  active
                    ? "border-sidebar-accent ring-2 ring-sidebar-accent/25"
                    : "border-sidebar-border hover:scale-105",
                )}
                style={{ background: preset.palette.swatch }}
              >
                <SidebarHoverLabel label={preset.label} meta={preset.description} />
              </button>
            );
          })}
        </div>
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
        <div className="mt-1.5 grid max-h-36 grid-cols-2 gap-1.5 overflow-y-auto pr-0.5">
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
      ) : null}
    </div>
  );
}
