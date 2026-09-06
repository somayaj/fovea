import { Handle, Position } from "@xyflow/react";

const HANDLE = "!h-1.5 !w-1.5 !border-0 !bg-transparent !opacity-0";

/** Slightly irregular circle — hand-drawn feel */
const ORGANIC_RADIUS = "rounded-[48%_52%_50%_48%_/_52%_48%_50%_50%]";

function handleToward(focusX, focusY, nodeX, nodeY) {
  const angle = (Math.atan2(focusY - nodeY, focusX - nodeX) * 180) / Math.PI;
  if (angle >= -45 && angle < 45) return Position.Right;
  if (angle >= 45 && angle < 135) return Position.Bottom;
  if (angle >= -135 && angle < -45) return Position.Top;
  return Position.Left;
}

function truncate(text, max) {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function MindMapNode({ data, selected, tier }) {
  const isHub = tier === "hub";
  const isLeaf = tier === "leaf";
  const handlePos = data.handlePosition || Position.Left;
  const color = data.branchColor || "#1c1917";
  const rotation = data.rotation || 0;

  const sizeClass = isHub ? "h-28 w-28" : isLeaf ? "h-14 w-14" : "h-[4.5rem] w-[4.5rem]";
  const textClass = isHub
    ? "text-sm font-bold leading-tight text-stone-900"
    : isLeaf
      ? "text-[8px] font-semibold leading-tight"
      : "text-[10px] font-semibold leading-tight";
  const borderClass = isHub ? "border-[3.5px] border-stone-900 bg-white" : `border-2 bg-white`;

  return (
    <div className="relative flex flex-col items-center" style={{ transform: `rotate(${rotation}deg)` }}>
      {(isHub || selected) && (
        <span
          className={[
            "pointer-events-none absolute rounded-full animate-ping",
            isHub ? "h-32 w-32 bg-brand/25" : "h-20 w-20",
          ].join(" ")}
          aria-hidden="true"
        />
      )}
      <div
        className={[
          "relative flex items-center justify-center p-2 text-center transition-transform duration-300",
          ORGANIC_RADIUS,
          sizeClass,
          borderClass,
          isHub ? "shadow-sm animate-node-throb" : "",
          selected ? "scale-125 shadow-lg ring-2 ring-brand/40" : "hover:scale-105",
        ].join(" ")}
        style={isHub ? undefined : { borderColor: color, color }}
      >
        {isHub ? (
          <>
            <Handle type="source" position={Position.Top} className={HANDLE} id="st" />
            <Handle type="source" position={Position.Right} className={HANDLE} id="sr" />
            <Handle type="source" position={Position.Bottom} className={HANDLE} id="sb" />
            <Handle type="source" position={Position.Left} className={HANDLE} id="sl" />
          </>
        ) : (
          <>
            <Handle type="target" position={handlePos} className={HANDLE} />
            {!isLeaf ? <Handle type="source" position={handlePos} className={HANDLE} id="s" /> : null}
          </>
        )}
        <span className={textClass}>
          {truncate(data.title, isHub ? 28 : isLeaf ? 14 : 20)}
        </span>
      </div>
    </div>
  );
}

export function HubNode({ data, selected }) {
  return <MindMapNode data={data} selected={selected} tier="hub" />;
}

export function BranchNode({ data, selected }) {
  return <MindMapNode data={data} selected={selected} tier="branch" />;
}

export function LeafNode({ data, selected }) {
  return <MindMapNode data={data} selected={selected} tier="leaf" />;
}

export const radialNodeTypes = {
  hub: HubNode,
  branch: BranchNode,
  leaf: LeafNode,
};

export function radialNodeFromTask(node, centerId, focusPos, channels, selectedId) {
  const channelName = channels?.find((c) => c.id === node.channel_id)?.name;
  const tier = node.tier || (node.id === centerId ? "hub" : "branch");
  const typeMap = { hub: "hub", branch: "branch", leaf: "leaf" };

  return {
    id: node.id,
    type: typeMap[tier] || "branch",
    position: { x: node.x, y: node.y },
    origin: [0.5, 0.5],
    draggable: false,
    selected: node.id === selectedId,
    zIndex: tier === "hub" ? 30 : tier === "branch" ? 10 : 5,
    data: {
      ...node,
      type: node.type,
      title: node.title,
      priority: node.priority,
      channelName,
      tier,
      rotation: node.rotation,
      branchColor: node.branchColor,
      handlePosition:
        focusPos && tier !== "hub"
          ? handleToward(focusPos.x, focusPos.y, node.x, node.y)
          : Position.Left,
    },
  };
}
