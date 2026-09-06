import { CLOUD_PATH } from "../lib/cloudShape.js";

export function CloudFrameNode({ data }) {
  const { width, height } = data;

  return (
    <div className="pointer-events-none" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 60"
        aria-hidden="true"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="cloud-fill" x1="20" y1="8" x2="80" y2="52">
            <stop offset="0%" stopColor="#fafaf9" />
            <stop offset="100%" stopColor="#f5f5f4" />
          </linearGradient>
          <filter id="cloud-shadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#78716c" floodOpacity="0.1" />
          </filter>
        </defs>

        <path
          d={CLOUD_PATH}
          fill="url(#cloud-fill)"
          stroke="#e7e5e4"
          strokeWidth="0.4"
          filter="url(#cloud-shadow)"
        />
      </svg>
    </div>
  );
}

export const cloudFrameNodeTypes = {
  cloudFrame: CloudFrameNode,
};

export function cloudFrameNode(bounds) {
  return {
    id: "__cloud_frame__",
    type: "cloudFrame",
    position: { x: bounds.left, y: bounds.top },
    draggable: false,
    selectable: false,
    focusable: false,
    zIndex: 0,
    data: {
      width: bounds.width,
      height: bounds.height,
    },
  };
}
