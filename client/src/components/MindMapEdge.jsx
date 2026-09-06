import { BaseEdge, getBezierPath } from "@xyflow/react";
import { branchColors } from "../lib/foveaTheme.js";

export function branchColor(index = 0) {
  const colors = branchColors();
  return colors[index % colors.length];
}

export default function MindMapEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) {
  const color = data?.color || branchColor(data?.branchIndex ?? 0);
  const active = data?.active;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.35,
  });

  return (
    <g className={`mindmap-edge ${active ? "mindmap-edge-active" : "mindmap-edge-quiet"}`}>
      <BaseEdge id={id} path={edgePath} style={{ opacity: 0, pointerEvents: "none" }} />
      <path className="mindmap-branch-shadow" d={edgePath} style={{ stroke: color }} />
      <path className="mindmap-branch" d={edgePath} style={{ stroke: color }} />
    </g>
  );
}
