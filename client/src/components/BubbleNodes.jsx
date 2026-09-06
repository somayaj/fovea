import { Handle, Position } from "@xyflow/react";
import { PriorityBadge } from "./ui.jsx";

const HANDLE = "!h-1 !w-1 !border-0 !bg-transparent !opacity-0";

function BubbleNode({ data, selected }) {
  const size = data.bubbleSize || 56;
  const isHub = data.isHub;

  return (
    <div className="relative flex flex-col items-center">
      <Handle type="target" position={Position.Top} className={HANDLE} />
      <Handle type="source" position={Position.Bottom} className={HANDLE} id="s" />

      {(isHub || selected) && (
        <span className="pointer-events-none absolute h-4 w-4 animate-ping rounded-full bg-white/60" aria-hidden="true" />
      )}

      <div
        className={[
          "flex items-center justify-center rounded-full p-2 text-center shadow-md transition-transform duration-300",
          isHub ? "animate-node-throb ring-4 ring-white/50" : "",
          selected ? "scale-125 ring-2 ring-stone-900/20" : "hover:scale-110",
        ].join(" ")}
        style={{
          width: size,
          height: size,
          backgroundColor: data.wordColor,
        }}
      >
        <span
          className="font-bold leading-tight text-white drop-shadow-sm"
          style={{ fontSize: Math.max(9, size * 0.14) }}
        >
          {data.title.length > 18 ? `${data.title.slice(0, 16)}…` : data.title}
        </span>
      </div>
    </div>
  );
}

export function HubNode(props) {
  return <BubbleNode {...props} />;
}

export function BranchNode(props) {
  return <BubbleNode {...props} />;
}

export function LeafNode(props) {
  return <BubbleNode {...props} />;
}

export const bubbleNodeTypes = {
  hub: HubNode,
  branch: BranchNode,
  leaf: LeafNode,
};

export function bubbleNodeFromTask(node, selectedId) {
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
      bubbleSize: node.bubbleSize,
      wordColor: node.wordColor,
      isHub: node.isHub,
      branchColor: node.branchColor,
      tier,
    },
  };
}
