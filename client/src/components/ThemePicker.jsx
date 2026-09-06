import { useTheme } from "../context/ThemeContext.jsx";
import SidebarHoverLabel from "./SidebarHoverLabel.jsx";
import { cn } from "../lib/tw.js";

export default function ThemePicker({ collapsed = false }) {
  const { themeId, presets, setTheme } = useTheme();

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
    <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
      <p className="mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
        Colors
      </p>
      <div className="grid grid-cols-2 gap-1.5">
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
    </div>
  );
}
