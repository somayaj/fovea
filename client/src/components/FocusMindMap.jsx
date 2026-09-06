import { Link } from "react-router-dom";
import TypePin from "./TypePin.jsx";
import { typeLabel } from "../lib/content.js";
import { focusBranchColors } from "../lib/foveaTheme.js";
import { useTheme } from "../context/ThemeContext.jsx";
import { useViewportWidth } from "../hooks/useViewportWidth.js";
import { PriorityBadge } from "./ui.jsx";
import { tw, cn } from "../lib/tw.js";

const CX = 400;
const CY = 280;
const HUB_R = 88;
const VIEW_W = 800;
const VIEW_H = 560;

function branchRadius(viewportWidth) {
  if (viewportWidth < 480) return 118;
  if (viewportWidth < 768) return 150;
  if (viewportWidth < 1024) return 175;
  return 195;
}

function branchPath(tx, ty, branchR) {
  const dx = tx - CX;
  const dy = ty - CY;
  const len = Math.hypot(dx, dy) || 1;
  const sx = CX + (dx / len) * (HUB_R + 4);
  const sy = CY + (dy / len) * (HUB_R + 4);
  const ex = tx - (dx / len) * 52;
  const ey = ty - (dy / len) * 36;
  const cpx = (sx + ex) / 2 + dy * 0.12;
  const cpy = (sy + ey) / 2 - dx * 0.12;
  return `M ${sx} ${sy} Q ${cpx} ${cpy} ${ex} ${ey}`;
}

function layoutBranches(items, branchR, branchColors) {
  const count = items.length;
  if (count === 0) return [];

  return items.map((item, i) => {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    const x = CX + branchR * Math.cos(angle);
    const y = CY + branchR * Math.sin(angle);
    const valign = Math.sin(angle) < -0.3 ? "bottom" : Math.sin(angle) > 0.3 ? "top" : "center";

    return {
      ...item,
      x,
      y,
      valign,
      color: branchColors[i % branchColors.length],
      path: branchPath(x, y, branchR),
    };
  });
}

function SubtopicCard({ task, branch, channels }) {
  const channel = channels?.find((c) => c.id === task.channel_id)?.name;

  return (
    <div
      className="mindmap-subtopic"
      style={{
        left: `${(branch.x / VIEW_W) * 100}%`,
        top: `${(branch.y / VIEW_H) * 100}%`,
        transform:
          branch.valign === "top"
            ? "translate(-50%, 0)"
            : branch.valign === "bottom"
              ? "translate(-50%, -100%)"
              : "translate(-50%, -50%)",
      }}
    >
      <span className={cn(tw.label, "mb-1 block text-stone-400")}>
        {branch.kind === "linked" ? "Connected" : "Nearby"}
      </span>
      <div className={cn(tw.card, "max-w-[190px] px-4 py-3.5")}>
        <div className="mb-2 flex justify-center">
          <TypePin type={task.type} size="sm" />
        </div>
        <div className="mb-2 flex items-center justify-between gap-2">
            <PriorityBadge priority={task.priority || "p2"} />
            <span className="text-xs text-stone-400">{typeLabel(task.type)}</span>
          </div>
          <h3 className="text-sm font-semibold leading-snug text-stone-900">{task.title}</h3>
          {channel ? <p className="mt-1.5 text-sm text-stone-500">#{channel}</p> : null}
      </div>
    </div>
  );
}

export default function FocusMindMap({ focus, linked, related, channels, focusChannel }) {
  const { palette } = useTheme();
  const viewportWidth = useViewportWidth();
  const branchR = branchRadius(viewportWidth);
  const branchColors = focusBranchColors(palette);
  const branches = layoutBranches([
    ...linked.map((t) => ({ task: t, kind: "linked" })),
    ...related.map((t) => ({ task: t, kind: "related" })),
  ].slice(0, 8), branchR, branchColors);

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm" style={{ backgroundColor: palette.bg }}>
      <div className="mindmap-canvas relative mx-auto" style={{ maxWidth: VIEW_W }}>
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {branches.map((b) => (
            <g key={b.task.id}>
              <path d={b.path} fill="none" stroke={b.color} strokeWidth="2" strokeLinecap="round" opacity="0.25" />
              <path d={b.path} fill="none" stroke={b.color} strokeWidth="1.5" strokeLinecap="round" />
            </g>
          ))}
        </svg>

        <div
          className="mindmap-hub mindmap-hub-throb"
          style={{ left: `${(CX / VIEW_W) * 100}%`, top: `${(CY / VIEW_H) * 100}%` }}
        >
          <span className="sketch-hub-glow" aria-hidden="true" />
          <div className="mindmap-hub-inner sketch-box-focus-throb relative z-10">
            <div className="mb-3 flex justify-center pt-4">
              <TypePin type={focus.type || "task"} size="md" />
            </div>
            <div className="mindmap-hub-body">
              <p className={tw.label}>Your #1 this week</p>
              <h2 className="text-base font-semibold leading-snug text-stone-900">{focus.title}</h2>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                <PriorityBadge priority={focus.priority} />
                {focusChannel ? <span className="text-sm text-stone-500">#{focusChannel}</span> : null}
              </div>
            </div>
          </div>
        </div>

        {branches.map((branch) => (
          <SubtopicCard key={branch.task.id} task={branch.task} branch={branch} channels={channels} />
        ))}
      </div>

      {linked.length + related.length === 0 ? (
        <div className="border-t border-stone-200 px-6 py-8 text-center">
          <p className="text-base leading-relaxed text-stone-500">
            No connected tasks yet — link a few on the{" "}
            <Link to="/map" className="font-medium text-stone-900 underline underline-offset-2">task map</Link>
            {" "}and they&apos;ll show up here.
          </p>
        </div>
      ) : null}
    </section>
  );
}
