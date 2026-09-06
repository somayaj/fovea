import { Handle, Position } from "@xyflow/react";

const TYPE_TINT = {
  idea: "#c4a99a",
  task: "#c45f3e",
  milestone: "#8b5a6b",
};

const PRIORITY_LABEL = { p0: "Critical", p1: "High", p2: "Normal", p3: "Low" };

function handleToward(focusX, focusY, nodeX, nodeY) {
  const angle = (Math.atan2(focusY - nodeY, focusX - nodeX) * 180) / Math.PI;
  if (angle >= -45 && angle < 45) return Position.Right;
  if (angle >= 45 && angle < 135) return Position.Bottom;
  if (angle >= -135 && angle < -45) return Position.Top;
  return Position.Left;
}

export function SomaNode({ data, selected }) {
  const tint = TYPE_TINT[data.type] || TYPE_TINT.task;
  const label = PRIORITY_LABEL[data.priority] || "Top focus";

  return (
    <div className={`synapse-node soma-node nerve-soma-node nerve-throb ${selected ? "selected" : ""}`}>
      <span className="soma-ring soma-ring-a" aria-hidden="true" />
      <span className="soma-ring soma-ring-b" aria-hidden="true" />
      <span className="soma-ring soma-ring-c" aria-hidden="true" />
      <span className="soma-membrane" style={{ borderColor: tint }} aria-hidden="true" />
      <span className="soma-nucleus-dot" aria-hidden="true" />
      <Handle type="target" position={Position.Top} className="synapse-handle" id="t" />
      <Handle type="target" position={Position.Right} className="synapse-handle" id="r" />
      <Handle type="target" position={Position.Bottom} className="synapse-handle" id="b" />
      <Handle type="target" position={Position.Left} className="synapse-handle" id="l" />
      <Handle type="source" position={Position.Top} className="synapse-handle" id="st" />
      <Handle type="source" position={Position.Right} className="synapse-handle" id="sr" />
      <Handle type="source" position={Position.Bottom} className="synapse-handle" id="sb" />
      <Handle type="source" position={Position.Left} className="synapse-handle" id="sl" />
      <div className="soma-content">
        <span className={`center-priority ${data.priority || "p0"}`}>{label}</span>
        <h3 className="center-title soma-title">{data.title}</h3>
        <span className="fovea-label">Synapse hub · highest priority</span>
        {data.channelName ? <span className="node-channel">#{data.channelName}</span> : null}
      </div>
    </div>
  );
}

export function TerminalNode({ data, selected }) {
  const tint = data.branchColor || TYPE_TINT[data.type] || TYPE_TINT.idea;
  const handlePos = data.handlePosition || Position.Left;

  return (
    <div className={`synapse-node terminal-node ${selected ? "selected nerve-throb-active" : "nerve-throb-subtle"}`}>
      <span className="terminal-axon" style={{ background: tint }} aria-hidden="true" />
      <span className="terminal-bouton" style={{ background: tint }} aria-hidden="true">
        <span className="bouton-vesicle bouton-vesicle-1" />
        <span className="bouton-vesicle bouton-vesicle-2" />
        <span className="bouton-vesicle bouton-vesicle-3" />
      </span>
      <Handle type="target" position={handlePos} className="synapse-handle" />
      <div className="terminal-body">
        <span className="node-type">{data.type}</span>
        <h3>{data.title}</h3>
        {data.priority ? <span className={`pill ${data.priority}`}>{data.priority}</span> : null}
      </div>
    </div>
  );
}

export const synapseNodeTypes = {
  soma: SomaNode,
  terminal: TerminalNode,
};

export function synapseNodeFromTask(node, centerId, focusPos, channels, layoutMeta = {}, selectedId) {
  const channelName = channels?.find((c) => c.id === node.channel_id)?.name;
  const isCenter = node.id === centerId;

  if (isCenter) {
    return {
      id: node.id,
      type: "soma",
      position: { x: node.x, y: node.y },
      origin: [0.5, 0.5],
      draggable: false,
      selected: node.id === selectedId,
      zIndex: 20,
      data: {
        ...node,
        type: node.type,
        title: node.title,
        priority: node.priority,
        channelName,
      },
    };
  }

  return {
    id: node.id,
    type: "terminal",
    position: { x: node.x, y: node.y },
    origin: [0.5, 0.5],
    draggable: false,
    selected: node.id === selectedId,
    zIndex: node.id === selectedId ? 15 : 1,
    data: {
      ...node,
      type: node.type,
      title: node.title,
      priority: node.priority,
      branchColor: layoutMeta.branchColor,
      handlePosition: focusPos
        ? handleToward(focusPos.x, focusPos.y, node.x, node.y)
        : Position.Left,
    },
  };
}

// Week view alias
export const weekNodeTypes = synapseNodeTypes;
export function weekNodeFromTask(node, focusId, focusPos, channels) {
  return synapseNodeFromTask(node, focusId, focusPos, channels, {}, null);
}
