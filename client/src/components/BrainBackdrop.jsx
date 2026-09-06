/** Head profile facing left with brain region — decorative backdrop */
const HEAD_PATH =
  "M 720 180 C 720 100, 640 60, 540 70 C 440 80, 340 130, 300 210 " +
  "C 260 290, 270 380, 310 460 C 330 510, 370 540, 420 530 " +
  "L 440 620 L 490 640 L 510 500 C 530 420, 590 360, 660 310 " +
  "C 700 270, 720 230, 720 180 Z";

const DECOR_LINES = [
  [520, 200, 420, 160, "#38bdf8"],
  [500, 275, 380, 240, "#2dd4bf"],
  [540, 300, 460, 360, "#ec4899"],
  [480, 320, 360, 300, "#eab308"],
  [560, 250, 640, 200, "#f97316"],
  [510, 350, 400, 420, "#4ade80"],
];

export default function BrainBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 960 720"
      aria-hidden="true"
    >
      <rect width="960" height="720" className="fill-map-bg" />
      <path d={HEAD_PATH} className="fill-map-head" opacity="0.95" />
      <g className="opacity-40">
        {DECOR_LINES.map(([x1, y1, x2, y2, color], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.5"
          />
        ))}
      </g>
    </svg>
  );
}
