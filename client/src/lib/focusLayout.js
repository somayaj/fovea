export const HERO_VIEW_W = 1536;
export const HERO_VIEW_H = 1024;

export const HERO_CENTER = { x: 0.5, y: 0.42, rotate: 0 };

/** Organic collage positions — matched to the login hero scatter. */
export const COLLAGE_SLOTS = [
  { x: 0.16, y: 0.11, rotate: -6, z: 2 },
  { x: 0.30, y: 0.15, rotate: 4, z: 3 },
  { x: 0.80, y: 0.13, rotate: -3, z: 2 },
  { x: 0.90, y: 0.22, rotate: 5, z: 4 },
  { x: 0.92, y: 0.44, rotate: -4, z: 3 },
  { x: 0.85, y: 0.58, rotate: 3, z: 2 },
  { x: 0.74, y: 0.80, rotate: -5, z: 5 },
  { x: 0.52, y: 0.88, rotate: 2, z: 4 },
  { x: 0.28, y: 0.84, rotate: -4, z: 3 },
  { x: 0.12, y: 0.66, rotate: 5, z: 2 },
  { x: 0.10, y: 0.40, rotate: -3, z: 4 },
  { x: 0.20, y: 0.52, rotate: 3, z: 3 },
];

export const FOCUS_SNAP_SLOTS = [HERO_CENTER, ...COLLAGE_SLOTS];

function slotKey({ x, y }) {
  return `${x.toFixed(4)},${y.toFixed(4)}`;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const PRIORITY_RANK = { p0: 0, p1: 1, p2: 2, p3: 3 };

function compareTaskPriority(a, b) {
  const pa = PRIORITY_RANK[a.task?.priority] ?? 9;
  const pb = PRIORITY_RANK[b.task?.priority] ?? 9;
  if (pa !== pb) return pa - pb;
  return (a.task?.title || "").localeCompare(b.task?.title || "");
}

/** Snap to the nearest open slot when dropped close enough. */
export function snapToSlot(position, takenKeys, threshold = 0.11) {
  const anchors = FOCUS_SNAP_SLOTS.filter((slot) => !takenKeys.has(slotKey(slot)));
  if (!anchors.length) return position;

  let best = position;
  let bestDist = threshold;
  for (const anchor of anchors) {
    const d = distance(position, anchor);
    if (d < bestDist) {
      bestDist = d;
      best = anchor;
    }
  }
  return best;
}

/** Find the nearest open slot (used when the preferred slot is taken). */
export function nearestOpenSlot(position, takenKeys) {
  const anchors = FOCUS_SNAP_SLOTS.filter((slot) => !takenKeys.has(slotKey(slot)));
  if (!anchors.length) return position;

  let best = anchors[0];
  let bestDist = Infinity;
  for (const anchor of anchors) {
    const d = distance(position, anchor);
    if (d < bestDist) {
      bestDist = d;
      best = anchor;
    }
  }
  return best;
}

/** Scatter tasks in collage slots — higher priority closer to center. */
export function organizedPositions(satellites, focusTask) {
  const positions = {};
  if (focusTask) {
    positions[focusTask.id] = { ...HERO_CENTER, z: 10 };
  }

  const collageOrder = [...COLLAGE_SLOTS].sort(
    (a, b) => distance(a, HERO_CENTER) - distance(b, HERO_CENTER),
  );
  const ordered = [...satellites].sort(compareTaskPriority);

  ordered.forEach(({ task }, i) => {
    const slot = collageOrder[i % collageOrder.length];
    positions[task.id] = slot;
  });

  return positions;
}

/** @deprecated use COLLAGE_SLOTS */
export const HERO_SLOTS = COLLAGE_SLOTS;
export const FOCUS_LINKED_SLOTS = COLLAGE_SLOTS.slice(0, 6);
export const FOCUS_RELATED_SLOTS = COLLAGE_SLOTS.slice(6);

export { slotKey };

export const FOCUS_VIEW_W = HERO_VIEW_W;
export const FOCUS_VIEW_H = HERO_VIEW_H;
export const FOCUS_CENTER = { x: HERO_CENTER.x * HERO_VIEW_W, y: HERO_CENTER.y * HERO_VIEW_H };
export const FOCUS_SLOTS = HERO_SLOTS.map((s) => ({
  x: s.x * HERO_VIEW_W,
  y: s.y * HERO_VIEW_H,
}));

export function heroSlotPosition(index) {
  const slot = HERO_SLOTS[index];
  if (!slot) return {};
  return { left: `${slot.x * 100}%`, top: `${slot.y * 100}%` };
}

export const focusSlotPosition = heroSlotPosition;
