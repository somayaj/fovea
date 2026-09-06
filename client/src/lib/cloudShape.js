export const CLOUD_WIDTH = 680;
export const CLOUD_HEIGHT = 380;

export function cloudScaleFor(nodeCount) {
  if (nodeCount <= 5) return 0.9;
  if (nodeCount <= 10) return 1;
  if (nodeCount <= 18) return 1.08;
  return 1.15;
}

export function cloudBounds(cx, cy, nodeCount) {
  const scale = cloudScaleFor(nodeCount);
  const width = CLOUD_WIDTH * scale;
  const height = CLOUD_HEIGHT * scale;
  const rx = width / 2;
  const ry = height / 2;

  return {
    cx,
    cy,
    scale,
    width,
    height,
    rx,
    ry,
    left: cx - rx,
    top: cy - ry,
  };
}

export function pointInCloud(x, y, bounds) {
  const dx = (x - bounds.cx) / bounds.rx;
  const dy = (y - bounds.cy) / bounds.ry;
  return dx * dx + dy * dy <= 0.92;
}

export function clampToCloud(x, y, bounds) {
  const dx = x - bounds.cx;
  const dy = y - bounds.cy;
  const nx = dx / bounds.rx;
  const ny = dy / bounds.ry;
  const dist = Math.hypot(nx, ny);
  if (dist <= 0.92) return { x, y };
  const s = 0.9 / dist;
  return { x: bounds.cx + dx * s, y: bounds.cy + dy * s };
}

/** Cloud outline in 100×60 viewBox space. */
export const CLOUD_PATH =
  "M18 34 C10 34 4 28 5 21 C2 15 7 9 15 8 C18 3 28 2 36 6 C42 2 52 3 58 9 C66 6 74 12 73 19 C78 23 77 31 70 34 C73 41 65 46 56 45 C51 52 40 54 32 50 C24 54 14 50 11 42 C6 43 4 37 7 32 C5 29 10 26 18 34 Z";
