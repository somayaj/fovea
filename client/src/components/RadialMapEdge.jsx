import { BaseEdge, getBezierPath } from "@xyflow/react";

function PulseDot({ path, color, dur, begin, size = 4 }) {
  return (
    <circle r={size} fill={color}>
      <animate attributeName="r" values={`${size};${size + 2};${size}`} dur="1.4s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.5;1;0.5" dur="1.4s" repeatCount="indefinite" />
      <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={path} />
    </circle>
  );
}

export default function RadialMapEdge({
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
  const color = data?.color || "#a8a29e";
  const isLeaf = data?.edgeTier === "leaf";
  const delay = data?.pulseDelay ?? 0;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: isLeaf ? 0.4 : 0.28,
  });

  const dur = active ? "1.6s" : "2.4s";

  return (
    <g>
      <BaseEdge id={id} path={edgePath} style={{ opacity: 0, pointerEvents: "none" }} />
      <path
        d={edgePath}
        stroke={color}
        strokeWidth={active ? 2.5 : isLeaf ? 1.5 : 2}
        fill="none"
        strokeLinecap="round"
        opacity={active ? 1 : 0.7}
      />
      <PulseDot path={edgePath} color={color} dur={dur} begin={`${delay}s`} size={active ? 5 : 3.5} />
      <PulseDot path={edgePath} color={color} dur={dur} begin={`${delay + 0.5}s`} size={active ? 3.5 : 2.5} />
      {active ? (
        <PulseDot path={edgePath} color={color} dur={dur} begin={`${delay + 1}s`} size={2.5} />
      ) : null}
    </g>
  );
}
