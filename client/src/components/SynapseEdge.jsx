import { BaseEdge, getBezierPath } from "@xyflow/react";

function splitAtCleft(sourceX, sourceY, targetX, targetY, gap = 20) {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const mx = (sourceX + targetX) / 2;
  const my = (sourceY + targetY) / 2;
  const half = gap / 2;
  return {
    preEnd: { x: mx - ux * half, y: my - uy * half },
    postStart: { x: mx + ux * half, y: my + uy * half },
    cleft: { x: mx, y: my },
  };
}

export default function SynapseEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const active = data?.active;
  const color = data?.color || "#c45f3e";
  const { preEnd, postStart, cleft } = splitAtCleft(sourceX, sourceY, targetX, targetY, active ? 24 : 18);
  const vesiclePath = `M ${preEnd.x} ${preEnd.y} L ${postStart.x} ${postStart.y}`;
  const dur = active ? "1s" : "1.8s";
  const delay = active ? "0s" : `${(data?.branchIndex ?? 0) * 0.15}s`;

  return (
    <g className={`synapse-edge ${active ? "synapse-edge-active" : "synapse-edge-quiet"}`}>
      <BaseEdge id={id} path={edgePath} style={{ opacity: 0, pointerEvents: "none" }} />
      <path
        className="synapse-axon"
        d={`M ${sourceX} ${sourceY} L ${preEnd.x} ${preEnd.y}`}
        style={{ stroke: color }}
      />
      <path
        className="synapse-axon"
        d={`M ${postStart.x} ${postStart.y} L ${targetX} ${targetY}`}
        style={{ stroke: color }}
      />
      <ellipse
        className="synapse-bouton"
        cx={preEnd.x}
        cy={preEnd.y}
        rx={active ? 8 : 6}
        ry={active ? 10 : 8}
        style={{ fill: color }}
      />
      <circle
        className="synapse-spine"
        cx={postStart.x}
        cy={postStart.y}
        r={active ? 5 : 3.5}
        style={{ fill: color }}
      />
      <rect
        className="synapse-cleft"
        x={cleft.x - 7}
        y={cleft.y - 2.5}
        width={14}
        height={5}
        transform={`rotate(${Math.atan2(targetY - sourceY, targetX - sourceX) * (180 / Math.PI)} ${cleft.x} ${cleft.y})`}
      />
      <circle className="synapse-vesicle" r={active ? 4 : 3} fill={color}>
        <animateMotion dur={dur} begin={delay} repeatCount="indefinite" path={vesiclePath} />
      </circle>
      <circle className="synapse-vesicle synapse-vesicle-trail" r={active ? 2.5 : 2} fill={color} opacity="0.55">
        <animateMotion dur={dur} begin={`${parseFloat(delay) + 0.14}s`} repeatCount="indefinite" path={vesiclePath} />
      </circle>
      {active ? (
        <circle className="synapse-vesicle synapse-vesicle-trail" r="2" fill="#fceee8" opacity="0.8">
          <animateMotion dur={dur} begin={`${parseFloat(delay) + 0.28}s`} repeatCount="indefinite" path={vesiclePath} />
        </circle>
      ) : null}
    </g>
  );
}
