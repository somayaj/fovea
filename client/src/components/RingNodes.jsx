import { Handle, Position } from "@xyflow/react";

const HANDLE = "!h-1 !w-1 !border-0 !bg-transparent !opacity-0";

function RingNode({ data, selected, tier }) {
  const isHub = tier === "hub";
  const isLeaf = tier === "leaf";
  const color = data.branchColor || data.wordColor || "#c45f3e";
  const size = isHub ? 96 : isLeaf ? 48 : 68;

  return (
    <div className="flex max-w-[140px] flex-col items-center">
      <Handle type="target" position={Position.Top} className={HANDLE} />
      <Handle type="source" position={Position.Bottom} className={HANDLE} id="s" />

      {(isHub || selected) && (
        <span
          className="pointer-events-none absolute mt-2 h-3 w-3 animate-ping rounded-full bg-brand"
          style={{ top: size / 2 - 6 }}
          aria-hidden="true"
        />
      )}

      <div
        className={[
          "relative shrink-0 rounded-full bg-white shadow-md transition-transform duration-300",
          isHub ? "border-[4px] animate-node-throb" : "border-[3px]",
          selected ? "scale-110 ring-2 ring-brand/25" : "hover:scale-105",
        ].join(" ")}
        style={{ width: size, height: size, borderColor: color }}
      >
        <span
          className="absolute inset-0 m-auto h-2 w-2 rounded-full"
          style={{ backgroundColor: color, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          aria-hidden="true"
        />
      </div>

      <p
        className={[
          "mt-2 w-full text-center font-bold leading-snug text-stone-800",
          isHub ? "text-sm" : isLeaf ? "text-[10px]" : "text-xs",
          selected ? "text-brand" : "",
        ].join(" ")}
      >
        {data.title}
      </p>
    </div>
  );
}

export function HubNode({ data, selected }) {
  return <RingNode data={data} selected={selected} tier="hub" />;
}

export function BranchNode({ data, selected }) {
  return <RingNode data={data} selected={selected} tier="branch" />;
}

export function LeafNode({ data, selected }) {
  return <RingNode data={data} selected={selected} tier="leaf" />;
}

export const ringNodeTypes = {
  hub: HubNode,
  branch: BranchNode,
  leaf: LeafNode,
};

export function ringNodeFromTask(node, selectedId) {
  const tier = node.tier || "branch";
  const typeMap = { hub: "hub", branch: "branch", leaf: "leaf" };

  return {
    id: node.id,
    type: typeMap[tier] || "branch",
    position: { x: node.x, y: node.y },
    origin: [0.5, 0.5],
    draggable: false,
    selected: node.id === selectedId,
    zIndex: tier === "hub" ? 30 : node.id === selectedId ? 20 : 5,
    data: {
      ...node,
      title: node.title,
      branchColor: node.branchColor,
      wordColor: node.branchColor,
      isHub: tier === "hub",
      tier,
    },
  };
}
