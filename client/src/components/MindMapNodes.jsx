import { Handle, Position } from "@xyflow/react";
import { IMAGES } from "../lib/images.js";
import { PriorityBadge } from "./ui.jsx";
import { branchColor } from "./MindMapEdge.jsx";

function handleToward(focusX, focusY, nodeX, nodeY) {
  const angle = (Math.atan2(focusY - nodeY, focusX - nodeX) * 180) / Math.PI;
  if (angle >= -45 && angle < 45) return Position.Right;
  if (angle >= 45 && angle < 135) return Position.Bottom;
  if (angle >= -135 && angle < -45) return Position.Top;
  return Position.Left;
}

export function CenterNode({ data, selected }) {
  return (
    <div className={`mindmap-node center-node ${selected ? "selected" : ""}`}>
      <span className="center-glow center-glow-1" aria-hidden="true" />
      <span className="center-glow center-glow-2" aria-hidden="true" />
      <Handle type="target" position={Position.Top} className="mindmap-handle" id="t" />
      <Handle type="target" position={Position.Right} className="mindmap-handle" id="r" />
      <Handle type="target" position={Position.Bottom} className="mindmap-handle" id="b" />
      <Handle type="target" position={Position.Left} className="mindmap-handle" id="l" />
      <Handle type="source" position={Position.Top} className="mindmap-handle" id="st" />
      <Handle type="source" position={Position.Right} className="mindmap-handle" id="sr" />
      <Handle type="source" position={Position.Bottom} className="mindmap-handle" id="sb" />
      <Handle type="source" position={Position.Left} className="mindmap-handle" id="sl" />

      <div className="center-body">
        <img src={IMAGES.focusInstant} alt="" className="center-hero" />
        <span className="center-topic-label">Central topic</span>
        <h3 className="center-title">{data.title}</h3>
        <div className="center-footer">
          {data.priority ? <PriorityBadge priority={data.priority} /> : null}
          {data.channelName ? (
            <span className="node-channel">#{data.channelName}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BranchCard({ data, selected, tierLabel, withSource }) {
  const color = data.branchColor || branchColor(data.branchIndex ?? 0);
  const handlePos = data.handlePosition || Position.Left;
  const typeLabel = data.type === "milestone" ? "Milestone" : data.type === "idea" ? "Idea" : "Task";

  return (
    <div className={`mindmap-node branch-node ${selected ? "selected" : ""}`}>
      <span className="branch-tier-label" style={{ color }}>{tierLabel}</span>
      <Handle type="target" position={handlePos} className="mindmap-handle" />
      {withSource ? (
        <Handle type="source" position={handlePos} className="mindmap-handle" id="s" />
      ) : null}
      <div className="branch-body" style={{ borderLeftColor: color }}>
        <span className="branch-accent" style={{ background: color }} aria-hidden="true" />
        <div className="branch-header">
          {data.priority ? <PriorityBadge priority={data.priority} /> : null}
          <span className="node-type">{typeLabel}</span>
        </div>
        <h3>{data.title}</h3>
        {data.channelName ? (
          <span className="node-channel">#{data.channelName}</span>
        ) : null}
      </div>
    </div>
  );
}

export function BranchNode({ data, selected }) {
  return <BranchCard data={data} selected={selected} tierLabel="Main branch" withSource />;
}

export function LeafNode({ data, selected }) {
  return <BranchCard data={data} selected={selected} tierLabel="Subtopic" />;
}

export const mindMapNodeTypes = {
  center: CenterNode,
  branch: BranchNode,
  leaf: LeafNode,
};

export function mindMapNodeFromTask(node, centerId, focusPos, channels, selectedId) {
  const channelName = channels?.find((c) => c.id === node.channel_id)?.name;
  const isCenter = node.id === centerId;
  const tier = node.tier || (isCenter ? "hub" : "branch");
  const typeMap = { hub: "center", branch: "branch", leaf: "leaf" };

  return {
    id: node.id,
    type: typeMap[tier] || "branch",
    position: { x: node.x, y: node.y },
    origin: [0.5, 0.5],
    draggable: false,
    selected: node.id === selectedId,
    zIndex: isCenter ? 30 : node.id === selectedId ? 20 : 10,
    data: {
      ...node,
      type: node.type,
      title: node.title,
      priority: node.priority,
      channelName,
      branchIndex: node.branchIndex,
      branchColor: node.branchColor,
      handlePosition:
        focusPos && !isCenter
          ? handleToward(focusPos.x, focusPos.y, node.x, node.y)
          : Position.Left,
    },
  };
}
