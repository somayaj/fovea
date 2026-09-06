import { BaseEdge, getBezierPath } from "@xyflow/react";

const STROKE = "#c45f3e";
const STROKE_ACTIVE = "#a84832";

export default function SketchMapEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) {
  const active = data?.active;
  const dimmed = data?.dimmed;
  const weekHighlight = data?.weekHighlight;
  const stroke = data?.branchColor || (active || weekHighlight ? STROKE_ACTIVE : STROKE);

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.25,
  });

  return (
    <g>
      <BaseEdge id={id} path={edgePath} style={{ opacity: 0, pointerEvents: "none" }} />
      <path
        d={edgePath}
        stroke={stroke}
        strokeWidth={active || weekHighlight ? 3 : 2.25}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={dimmed ? 0.18 : active || weekHighlight ? 0.95 : 0.65}
        className="sketch-edge"
      />
    </g>
  );
}
