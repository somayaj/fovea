import { useTheme } from "../context/ThemeContext.jsx";
import { cn } from "../lib/tw.js";

/** Hub rings — same focal motif as the login / focus hero. */
function HubRings({ center, line, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      fill="none"
      aria-hidden="true"
    >
      {[88, 132, 176, 220].map((r) => (
        <circle key={r} cx="200" cy="200" r={r} stroke={line} strokeWidth="1.5" opacity="0.55" />
      ))}
      <circle cx="200" cy="200" r="36" fill={center} opacity="0.12" />
      <circle cx="200" cy="200" r="22" fill={center} opacity="0.22" />
    </svg>
  );
}

/**
 * Theme-aware focal backdrop — paper wash, accent glow, hub rings.
 * @param {"page"|"canvas"} variant — page = full inner pages; canvas = map/brainstorm pane
 */
export default function FocusAmbient({ variant = "page", className = "" }) {
  const { palette, preset } = useTheme();
  const isCanvas = variant === "canvas";

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {isCanvas ? (
        <div className="absolute inset-0" style={{ background: palette.bg }} />
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(165deg, ${palette.bg} 0%, ${palette.accentSoft} 58%, color-mix(in srgb, ${palette.bg} 86%, ${preset.collage.surfaceMix}) 100%)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 72% 48% at 50% 10%, ${palette.centerGlow}, transparent 70%)`,
            }}
          />
          <HubRings
            center={palette.center}
            line={palette.line}
            className="absolute left-1/2 top-[6%] h-[min(52vw,420px)] w-[min(52vw,420px)] -translate-x-1/2 opacity-[0.07]"
          />
        </>
      )}
    </div>
  );
}
