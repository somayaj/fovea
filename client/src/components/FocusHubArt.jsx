import { useTheme } from "../context/ThemeContext.jsx";
import { FOCUS_SLOTS, HERO_VIEW_H, HERO_VIEW_W } from "../lib/focusLayout.js";

const CX = HERO_VIEW_W * 0.5;
const CY = HERO_VIEW_H * 0.38;

/** Clean hub-and-spokes art — yellow focal point, navy structure. */
export default function FocusHubArt() {
  const { palette } = useTheme();
  const navy = palette.nodes?.[0] ?? "#0c1f3a";
  const yellow = palette.center;

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${HERO_VIEW_W} ${HERO_VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="focus-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill={navy} opacity="0.08" />
        </pattern>
        <radialGradient id="focus-glow" cx="50%" cy="38%" r="45%">
          <stop offset="0%" stopColor={yellow} stopOpacity="0.38" />
          <stop offset="55%" stopColor={yellow} stopOpacity="0.1" />
          <stop offset="100%" stopColor={palette.bg} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={HERO_VIEW_W} height={HERO_VIEW_H} fill={palette.bg} />
      <rect width={HERO_VIEW_W} height={HERO_VIEW_H} fill="url(#focus-grid)" />
      <rect width={HERO_VIEW_W} height={HERO_VIEW_H} fill="url(#focus-glow)" />

      {[120, 200, 280, 360].map((r) => (
        <circle
          key={r}
          cx={CX}
          cy={CY}
          r={r}
          fill="none"
          stroke={navy}
          strokeWidth="1.5"
          opacity="0.12"
        />
      ))}

      {FOCUS_SLOTS.map((slot, i) => (
        <g key={i}>
          <line
            x1={CX}
            y1={CY}
            x2={slot.x}
            y2={slot.y}
            stroke={navy}
            strokeWidth="2"
            opacity="0.22"
          />
          <circle cx={slot.x} cy={slot.y} r="12" fill={yellow} opacity="0.4" />
          <circle cx={slot.x} cy={slot.y} r="5" fill={yellow} />
        </g>
      ))}

      <circle cx={CX} cy={CY} r="80" fill={yellow} opacity="0.22">
        <animate attributeName="opacity" values="0.16;0.3;0.16" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="r" values="76;84;76" dur="3.2s" repeatCount="indefinite" />
      </circle>
      <circle cx={CX} cy={CY} r="52" fill="white" stroke={yellow} strokeWidth="4" />
      <circle cx={CX} cy={CY} r="10" fill={navy} />
    </svg>
  );
}
