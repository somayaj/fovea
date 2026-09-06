/** Layout helpers for radial / ring map views */
import { WORD_COLORS } from "./mapColors.js";

export const BRANCH_COLORS = ["#c45f3e", "#d4836a", "#b85a42", "#c47a2f", "#e8a088", "#a84832"];
export const HUB_COLOR = "#1e293b";

export const BRAIN_CX = 480;
export const BRAIN_CY = 360;

const PRIORITY_RANK = { p0: 0, p1: 1, p2: 2, p3: 3 };

export function edgeCount(nodeId, edges) {
  let count = 0;
  for (const edge of edges || []) {
    if (edge.source_id === nodeId || edge.target_id === nodeId) count += 1;
  }
  return count;
}

export function compareByPriorityAndFrequency(a, b, edges) {
  const pa = PRIORITY_RANK[a.priority] ?? 9;
  const pb = PRIORITY_RANK[b.priority] ?? 9;
  if (pa !== pb) return pa - pb;

  const fa = edgeCount(a.id, edges);
  const fb = edgeCount(b.id, edges);
  if (fa !== fb) return fb - fa;

  const dueA = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
  const dueB = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
  if (dueA !== dueB) return dueA - dueB;

  return (a.title || "").localeCompare(b.title || "");
}

export function pickCenterNode(nodes, edges, weekFocusId) {
  const pool = nodes.filter((n) => n.type === "task");
  const candidates = pool.length ? pool : nodes;
  if (!candidates.length) return null;

  if (weekFocusId && candidates.some((n) => n.id === weekFocusId)) {
    const focus = candidates.find((n) => n.id === weekFocusId);
    const top = [...candidates].sort((a, b) => compareByPriorityAndFrequency(a, b, edges))[0];
    if (focus && compareByPriorityAndFrequency(focus, top, edges) <= 0) {
      return weekFocusId;
    }
  }

  return [...candidates].sort((a, b) => compareByPriorityAndFrequency(a, b, edges))[0].id;
}

function neighborsOf(nodeId, edges) {
  const ids = new Set();
  for (const edge of edges || []) {
    if (edge.source_id === nodeId) ids.add(edge.target_id);
    if (edge.target_id === nodeId) ids.add(edge.source_id);
  }
  return ids;
}

function organicRotation(index) {
  return ((index * 13) % 7) - 3;
}

export function radialPolyLayout(centerId, nodes, edges, cx = BRAIN_CX, cy = BRAIN_CY) {
  const linkedToCenter = neighborsOf(centerId, edges);
  const rest = nodes
    .filter((n) => n.id !== centerId)
    .sort((a, b) => compareByPriorityAndFrequency(a, b, edges));

  const linked = rest.filter((n) => linkedToCenter.has(n.id));
  const unlinked = rest.filter((n) => !linkedToCenter.has(n.id));
  const mainBranches = [...linked, ...unlinked].slice(0, 9);
  const mainIds = new Set(mainBranches.map((n) => n.id));
  const leaves = rest.filter((n) => !mainIds.has(n.id));

  const MAIN_RX = 210;
  const MAIN_RY = 155;
  const LEAF_RX = 340;
  const LEAF_RY = 250;
  const branchCount = mainBranches.length;

  const branchMeta = mainBranches.map((branch, i) => {
    const angle = branchCount ? (Math.PI * 2 * i) / branchCount - Math.PI / 2 : 0;
    const color = BRANCH_COLORS[i % BRANCH_COLORS.length];
    return {
      id: branch.id,
      angle,
      color,
      branchIndex: i,
      rotation: organicRotation(i),
      x: cx + Math.cos(angle) * MAIN_RX,
      y: cy + Math.sin(angle) * MAIN_RY,
    };
  });

  const branchById = new Map(branchMeta.map((b) => [b.id, b]));

  const leafAssignments = new Map();
  for (const leaf of leaves) {
    let parentId = null;
    for (const branch of mainBranches) {
      if (neighborsOf(branch.id, edges).has(leaf.id)) {
        parentId = branch.id;
        break;
      }
    }
    if (!parentId && leaf.channel_id) {
      const sameChannel = mainBranches.find((b) => b.channel_id === leaf.channel_id);
      if (sameChannel) parentId = sameChannel.id;
    }
    if (!parentId && mainBranches.length) {
      parentId = mainBranches[leafAssignments.size % mainBranches.length].id;
    }
    if (parentId) {
      if (!leafAssignments.has(parentId)) leafAssignments.set(parentId, []);
      leafAssignments.get(parentId).push(leaf);
    }
  }

  const positioned = [];

  for (const node of nodes) {
    if (node.id === centerId) {
      positioned.push({
        ...node,
        x: cx,
        y: cy,
        tier: "hub",
        branchIndex: -1,
        branchColor: HUB_COLOR,
        wordColor: HUB_COLOR,
        isHub: true,
        rotation: 0,
      });
      continue;
    }

    const branchIdx = mainBranches.findIndex((b) => b.id === node.id);
    if (branchIdx >= 0) {
      const meta = branchMeta[branchIdx];
      positioned.push({
        ...node,
        x: meta.x,
        y: meta.y,
        tier: "branch",
        branchIndex: branchIdx,
        branchColor: meta.color,
        parentId: centerId,
        rotation: meta.rotation,
      });
      continue;
    }

    let placed = false;
    for (const [parentId, cluster] of leafAssignments) {
      const leafIdx = cluster.findIndex((l) => l.id === node.id);
      if (leafIdx < 0) continue;

      const parent = branchById.get(parentId);
      const count = cluster.length;
      const spread = Math.min(0.65, count * 0.22);
      const offset = count === 1 ? 0 : -spread / 2 + (spread * leafIdx) / (count - 1);
      const angle = parent.angle + offset;

      positioned.push({
        ...node,
        x: cx + Math.cos(angle) * LEAF_RX,
        y: cy + Math.sin(angle) * LEAF_RY,
        tier: "leaf",
        branchIndex: parent.branchIndex,
        branchColor: parent.color,
        parentId,
        rotation: organicRotation(parent.branchIndex + leafIdx),
      });
      placed = true;
      break;
    }

    if (!placed) {
      const i = positioned.filter((n) => n.tier !== "hub").length;
      const angle = (Math.PI * 2 * i) / Math.max(rest.length, 1) - Math.PI / 2;
      positioned.push({
        ...node,
        x: cx + Math.cos(angle) * MAIN_RX,
        y: cy + Math.sin(angle) * MAIN_RY,
        tier: "leaf",
        branchIndex: i % BRANCH_COLORS.length,
        branchColor: BRANCH_COLORS[i % BRANCH_COLORS.length],
        parentId: centerId,
        rotation: organicRotation(i),
      });
    }
  }

  return positioned;
}

export function radialLayout(centerId, nodes, cx, cy) {
  return radialPolyLayout(centerId, nodes, [], cx, cy);
}

export const NEURAL_COLORS = BRANCH_COLORS;
export const POLY_COLORS = BRANCH_COLORS;
