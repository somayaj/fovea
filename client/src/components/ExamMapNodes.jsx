import { Handle, Position } from "@xyflow/react";

const HANDLE = "!h-1 !w-1 !border-0 !bg-transparent !opacity-0";

export const FRIENDLY_COLORS = [
  { bg: "#fceee8", border: "#e8a088", text: "#a84832" },
  { bg: "#e8f5f0", border: "#8ecfba", text: "#2d6b5a" },
  { bg: "#eef4fc", border: "#9ec0e8", text: "#3d6a9e" },
  { bg: "#fdf3e8", border: "#f0c078", text: "#b45309" },
  { bg: "#f5eef8", border: "#c9b0db", text: "#7c5a9e" },
  { bg: "#fdeef2", border: "#f0a8b8", text: "#be4d6a" },
];

const PRIORITY_HINT = {
  p0: "Your top pick",
  p1: "High on the list",
  p2: "On the radar",
  p3: "When you have time",
};

function handleToward(focusX, focusY, nodeX, nodeY) {
  const angle = (Math.atan2(focusY - nodeY, focusX - nodeX) * 180) / Math.PI;
  if (angle >= -45 && angle < 45) return Position.Right;
  if (angle >= 45 && angle < 135) return Position.Bottom;
  if (angle >= -135 && angle < -45) return Position.Top;
  return Position.Left;
}

function palette(index = 0) {
  return FRIENDLY_COLORS[index % FRIENDLY_COLORS.length];
}

function HubNode({ data, selected }) {
  const hint = PRIORITY_HINT[data.priority] || "Your focus";

  return (
    <div
      className={[
        "flex max-w-[240px] flex-col items-center text-center transition-transform duration-300",
        selected ? "scale-105" : "hover:scale-[1.02]",
      ].join(" ")}
    >
      <Handle type="source" position={Position.Top} className={HANDLE} id="st" />
      <Handle type="source" position={Position.Right} className={HANDLE} id="sr" />
      <Handle type="source" position={Position.Bottom} className={HANDLE} id="sb" />
      <Handle type="source" position={Position.Left} className={HANDLE} id="sl" />

      <div className="relative mb-3">
        <span
          className="absolute inset-0 -m-3 rounded-full bg-brand/15 blur-md"
          aria-hidden="true"
        />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-soft to-white shadow-sm ring-2 ring-brand/20">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="8" stroke="#c45f3e" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" fill="#c45f3e" />
          </svg>
        </div>
      </div>

      <span className="mb-1 text-xs font-semibold text-brand">{hint}</span>
      <h2 className="m-0 font-hand text-2xl leading-snug text-stone-800">{data.title}</h2>
    </div>
  );
}

function PillNode({ data, selected }) {
  const colors = data.palette || palette(data.branchIndex ?? 0);
  const handlePos = data.handlePosition || Position.Left;
  const isIdea = data.type === "idea";

  return (
    <div
      className={[
        "transition-all duration-300",
        selected ? "scale-105" : "hover:scale-[1.03]",
      ].join(" ")}
    >
      <Handle type="target" position={handlePos} className={HANDLE} />
      <Handle type="source" position={handlePos} className={HANDLE} id="s" />
      <div
        className={[
          "cursor-pointer rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-sm whitespace-nowrap",
          isIdea ? "border-2 border-dashed bg-white/80" : "border-2",
        ].join(" ")}
        style={{
          backgroundColor: isIdea ? "#fafaf9" : colors.bg,
          borderColor: colors.border,
          color: colors.text,
        }}
      >
        {data.title}
      </div>
    </div>
  );
}

function TextNode({ data, selected }) {
  const colors = data.palette || palette(data.branchIndex ?? 0);
  const handlePos = data.handlePosition || Position.Left;

  return (
    <div
      className={[
        "max-w-[160px] text-center transition-transform duration-300",
        selected ? "scale-105" : "hover:scale-[1.03]",
      ].join(" ")}
    >
      <Handle type="target" position={handlePos} className={HANDLE} />
      <p
        className="m-0 cursor-pointer font-hand text-xl leading-snug"
        style={{ color: selected ? colors.text : "#57534e" }}
      >
        {data.title}
      </p>
    </div>
  );
}

export const examMapNodeTypes = {
  hub: HubNode,
  pill: PillNode,
  text: TextNode,
};

export function examMapNodeFromTask(node, centerId, focusPos, selectedId) {
  const isHub = node.id === centerId;
  const tier = node.tier || (isHub ? "hub" : "pill");
  const type = isHub ? "hub" : tier === "leaf" ? "text" : "pill";
  const branchIndex = node.branchIndex ?? 0;
  const paletteColors = palette(branchIndex);

  return {
    id: node.id,
    type,
    position: { x: node.x, y: node.y },
    origin: [0.5, 0.5],
    draggable: false,
    selected: node.id === selectedId,
    zIndex: isHub ? 30 : node.id === selectedId ? 20 : tier === "pill" ? 10 : 5,
    data: {
      ...node,
      title: node.title,
      priority: node.priority,
      branchIndex,
      branchColor: paletteColors.border,
      palette: paletteColors,
      handlePosition:
        focusPos && !isHub
          ? handleToward(focusPos.x, focusPos.y, node.x, node.y)
          : Position.Left,
    },
  };
}
