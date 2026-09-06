import { BaseEdge, getBezierPath } from "@xyflow/react";

export default function ExamMapEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) {
  const color = data?.color || "#e8a088";
  const isLeaf = data?.edgeTier === "leaf";
  const active = data?.active;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: isLeaf ? 0.5 : 0.35,
  });

  return (
    <g>
      <BaseEdge id={id} path={edgePath} style={{ opacity: 0, pointerEvents: "none" }} />
      <path
        d={edgePath}
        stroke={color}
        strokeWidth={active ? 3 : isLeaf ? 2 : 2.5}
        fill="none"
        strokeLinecap="round"
        opacity={active ? 0.9 : 0.55}
      />
      {isLeaf ? (
        <circle
          cx={sourceX}
          cy={sourceY}
          r={5}
          fill="white"
          stroke={color}
          strokeWidth={2}
          opacity={0.9}
        />
      ) : null}
    </g>
  );
}
