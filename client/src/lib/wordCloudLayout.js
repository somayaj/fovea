import { compareByPriorityAndFrequency } from "./radialLayout.js";
import { HUB_COLOR, colorForNode } from "./mapColors.js";
import { cloudBounds, clampToCloud, pointInCloud } from "./cloudShape.js";

export { HUB_COLOR };

const BASE_PRIORITY_SIZE = { p0: 34, p1: 28, p2: 24, p3: 20 };
const BASE_HUB = 44;
const BASE_IDEA = 19;
const MIN_FONT = 16;
const MAX_HUB = 48;

const BUBBLE_SIZE = { hub: 92, p0: 76, p1: 64, p2: 52, p3: 44, idea: 40 };

const RING_FRACTION = { hub: 0, p0: 0.2, p1: 0.36, p2: 0.52, p3: 0.66, idea: 0.58 };

function countScale(nodeCount) {
  if (nodeCount <= 8) return 1;
  if (nodeCount <= 14) return 0.94;
  if (nodeCount <= 22) return 0.88;
  return 0.82;
}

function titleScale(title) {
  const len = title?.length || 0;
  if (len <= 16) return 1;
  if (len <= 26) return 0.92;
  return 0.85;
}

function fontSizeFor(node, isCenter, nodeCount) {
  const scale = countScale(nodeCount) * titleScale(node.title);
  let size;

  if (isCenter) {
    size = BASE_HUB * scale;
    return Math.round(Math.min(MAX_HUB, Math.max(MIN_FONT + 6, size)));
  }

  if (node.type === "idea") {
    size = BASE_IDEA * scale;
  } else {
    size = (BASE_PRIORITY_SIZE[node.priority] || 22) * scale;
  }

  return Math.round(Math.max(MIN_FONT, size));
}

function bubbleSizeFor(node, isCenter) {
  if (isCenter) return BUBBLE_SIZE.hub;
  if (node.type === "idea") return BUBBLE_SIZE.idea;
  return BUBBLE_SIZE[node.priority] || 48;
}

function ringFor(node, isCenter) {
  if (isCenter) return "hub";
  if (node.type === "idea") return "idea";
  return node.priority || "p2";
}

function measure(title, fontSize) {
  const chars = title?.length || 4;
  const w = Math.max(chars * fontSize * 0.52, fontSize * 2.2);
  const h = fontSize * 1.3;
  return { w, h };
}

function boxOf(item) {
  const { w, h } = measure(item.title, item.fontSize);
  return { x: item.x, y: item.y, w, h };
}

function collides(candidate, placed) {
  const pad = 14;
  const a = {
    left: candidate.x - candidate.w / 2 - pad,
    right: candidate.x + candidate.w / 2 + pad,
    top: candidate.y - candidate.h / 2 - pad,
    bottom: candidate.y + candidate.h / 2 + pad,
  };

  for (const p of placed) {
    const b = boxOf(p);
    const bb = {
      left: b.x - b.w / 2,
      right: b.x + b.w / 2,
      top: b.y - b.h / 2,
      bottom: b.y + b.h / 2,
    };
    if (a.left < bb.right && a.right > bb.left && a.top < bb.bottom && a.bottom > bb.top) {
      return true;
    }
  }
  return false;
}

function fitsInCloud(candidate, bounds) {
  const corners = [
    { x: candidate.x - candidate.w / 2, y: candidate.y - candidate.h / 2 },
    { x: candidate.x + candidate.w / 2, y: candidate.y - candidate.h / 2 },
    { x: candidate.x - candidate.w / 2, y: candidate.y + candidate.h / 2 },
    { x: candidate.x + candidate.w / 2, y: candidate.y + candidate.h / 2 },
  ];
  return corners.every((p) => pointInCloud(p.x, p.y, bounds));
}

function placeOnRing(bounds, ringKey, slot, total, dims, placed) {
  const baseR = RING_FRACTION[ringKey] ?? 0.5;
  const radius = baseR * Math.min(bounds.rx, bounds.ry);
  const baseAngle = (slot / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;

  for (let tweak = 0; tweak < 24; tweak++) {
    const angle = baseAngle + tweak * 0.12;
    let x = bounds.cx + Math.cos(angle) * radius;
    let y = bounds.cy + Math.sin(angle) * radius * 0.82;
    const clamped = clampToCloud(x, y, bounds);
    x = clamped.x;
    y = clamped.y;

    const candidate = { x, y, ...dims };
    if (!collides(candidate, placed) && fitsInCloud(candidate, bounds)) {
      return { x, y };
    }
  }

  return clampToCloud(bounds.cx, bounds.cy, bounds);
}

/** Priority rings inside a soft cloud — hub centre, p0 inner, p3 outer. */
export function wordCloudLayout(centerId, nodes, edges, cx = 520, cy = 380) {
  const count = nodes.length;
  const bounds = cloudBounds(cx, cy, count);

  const sorted = [...nodes].sort((a, b) => {
    if (a.id === centerId) return -1;
    if (b.id === centerId) return 1;
    return compareByPriorityAndFrequency(a, b, edges);
  });

  const placed = [];
  const ringCounts = {};

  const queue = sorted.map((node, i) => {
    const isCenter = node.id === centerId;
    const ringKey = ringFor(node, isCenter);
    ringCounts[ringKey] = (ringCounts[ringKey] || 0) + 1;

    return {
      node,
      isCenter,
      fontSize: fontSizeFor(node, isCenter, count),
      bubbleSize: bubbleSizeFor(node, isCenter),
      color: colorForNode(node, isCenter),
      ringKey,
      index: i,
    };
  });

  const ringSlots = {};

  for (const item of queue) {
    const { node, isCenter, fontSize, bubbleSize, color, ringKey, index } = item;

    if (isCenter) {
      placed.push({
        ...node,
        x: bounds.cx,
        y: bounds.cy,
        fontSize,
        bubbleSize,
        wordColor: color,
        rotation: 0,
        tier: "hub",
        branchColor: color,
        branchIndex: -1,
        isHub: true,
      });
      continue;
    }

    const slot = ringSlots[ringKey] || 0;
    ringSlots[ringKey] = slot + 1;
    const dims = measure(node.title, fontSize);
    const { x, y } = placeOnRing(bounds, ringKey, slot, ringCounts[ringKey], dims, placed);

    placed.push({
      ...node,
      x,
      y,
      fontSize,
      bubbleSize,
      wordColor: color,
      rotation: 0,
      tier: index <= 8 ? "branch" : "leaf",
      branchColor: color,
      branchIndex: index,
      parentId: centerId,
      isHub: false,
    });
  }

  return { nodes: placed, cloudBounds: bounds };
}
