import { compareByPriorityAndFrequency } from "./radialLayout.js";
import { branchColors, workstreamColor } from "./foveaTheme.js";

export const MAP_COLUMN_WIDTH = 204;
export const MAP_WORKSTREAM_HEIGHT = 108;
export const MAP_TASK_CARD_HEIGHT = 224;

const COLUMN_WIDTH = MAP_COLUMN_WIDTH;
const COLUMN_GAP = 48;
const MAP_CARD_PHOTO_HEIGHT = 145;
const MAP_CARD_CAPTION_HEIGHT = 56;
const MAP_CARD_PADDING = 23;
const MAP_CARD_HEIGHT = MAP_TASK_CARD_HEIGHT;
const CHANNEL_HEADER_HEIGHT = MAP_WORKSTREAM_HEIGHT;
const TASK_CARD_HEIGHT = MAP_TASK_CARD_HEIGHT;
const TASK_GAP = 16;
const HEADER_TO_TASKS = TASK_GAP;
const MIN_SPREAD = COLUMN_WIDTH + COLUMN_GAP;

function rowPositions(count, cx, gap) {
  if (count === 0) return [];
  const total = (count - 1) * gap;
  const start = cx - total / 2;
  return Array.from({ length: count }, (_, i) => start + i * gap);
}

function layoutBranchRow(branches, branchMeta, { cx, startY, branchesPerRow, rowHeight, branchGap, colorOffset = 0 }) {
  branches.forEach((branch, i) => {
    const row = Math.floor(i / branchesPerRow);
    const col = i % branchesPerRow;
    const rowBranches = branches.slice(row * branchesPerRow, row * branchesPerRow + branchesPerRow);
    const rowXs = rowPositions(rowBranches.length, cx, branchGap);
    branchMeta.set(branch.id, {
      x: rowXs[col],
      y: startY + row * rowHeight,
      branchIndex: branch.branchIndex ?? i,
      color: branchColors()[(colorOffset + i) % branchColors().length],
    });
  });
  if (branches.length === 0) return startY;
  const rows = Math.ceil(branches.length / branchesPerRow);
  return startY + rows * rowHeight;
}

const PRIORITY_RANK = { p0: 0, p1: 1, p2: 2, p3: 3 };

function sortSpanSiblings(siblings, weekOrderIds = null) {
  const weekRank = weekOrderIds ? new Map(weekOrderIds.map((id, index) => [id, index])) : null;

  return [...siblings].sort((a, b) => {
    if (a.isRollup && !b.isRollup) return 1;
    if (!a.isRollup && b.isRollup) return -1;
    if (weekRank) {
      const ar = weekRank.has(a.id) ? weekRank.get(a.id) : Number.MAX_SAFE_INTEGER;
      const br = weekRank.has(b.id) ? weekRank.get(b.id) : Number.MAX_SAFE_INTEGER;
      if (ar !== br) return ar - br;
    }
    if (a.isRollup && !b.isRollup) return 1;
    if (!a.isRollup && b.isRollup) return -1;
    if (a.type !== b.type) return a.type === "task" ? -1 : 1;
    if (a.type === "task") {
      const ap = PRIORITY_RANK[a.priority] ?? 9;
      const bp = PRIORITY_RANK[b.priority] ?? 9;
      if (ap !== bp) return ap - bp;
    }
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}

function layoutLeafColumn(node, siblings, parent, weekOrderIds = null) {
  const ordered = sortSpanSiblings(siblings, weekOrderIds);
  const idx = ordered.findIndex((n) => n.id === node.id);
  if (idx < 0) return null;

  const startY = parent.y + CHANNEL_HEADER_HEIGHT + HEADER_TO_TASKS;

  return {
    x: parent.x,
    y: startY + idx * (TASK_CARD_HEIGHT + TASK_GAP),
    branchIndex: parent.branchIndex,
    branchColor: parent.color,
    columnIndex: parent.branchIndex,
  };
}

function layoutChannelColumns(channels, cx, topY, viewportWidth = 1100) {
  const branchMeta = new Map();
  const count = channels.length;
  if (count === 0) return branchMeta;

  const usableWidth = Math.max(viewportWidth * 0.94, COLUMN_WIDTH * count);
  const startX = cx - usableWidth / 2 + COLUMN_WIDTH / 2;

  if (count === 1) {
    branchMeta.set(channels[0].id, {
      x: cx,
      y: topY,
      branchIndex: channels[0].branchIndex ?? 0,
      color: workstreamColor(channels[0].title, 0),
      columnWidth: COLUMN_WIDTH,
    });
    return branchMeta;
  }

  const gap = Math.max(16, (usableWidth - count * COLUMN_WIDTH) / (count - 1));

  channels.forEach((channel, index) => {
    branchMeta.set(channel.id, {
      x: startX + index * (COLUMN_WIDTH + gap),
      y: topY,
      branchIndex: channel.branchIndex ?? index,
      color: workstreamColor(channel.title, index),
      columnWidth: COLUMN_WIDTH,
    });
  });

  return branchMeta;
}

function buildChannelColumnTree(treeNodes, channelDefs, filterChannelId) {
  const tasks = treeNodes.filter(
    (n) => n.type === "task" && !n.isRollup && !n.isChannelSummary,
  );
  const visibleChannels = filterChannelId
    ? channelDefs.filter((c) => c.id === filterChannelId && !c.archived)
    : [...channelDefs].filter((c) => !c.archived).sort((a, b) => a.name.localeCompare(b.name));

  const normalized = [];

  visibleChannels.forEach((channel, index) => {
    const summaryId = `__channel__${channel.id}`;
    const channelTasks = tasks.filter((t) => t.channel_id === channel.id);
    normalized.push({
      id: summaryId,
      type: "task",
      tier: "branch",
      branchIndex: index,
      parentId: null,
      isChannelSummary: true,
      title: channel.name,
      channelHint:
        channelTasks.length > 0
          ? `${channelTasks.length} task${channelTasks.length === 1 ? "" : "s"}`
          : "No tasks yet",
      groupSize: channelTasks.length,
      summaryChannelId: channel.id,
      summaryChannelLabel: channel.name,
    });
    for (const task of channelTasks) {
      normalized.push({
        ...task,
        tier: "leaf",
        branchIndex: index,
        parentId: summaryId,
      });
    }
  });

  if (!filterChannelId) {
    const unassigned = tasks.filter((t) => !t.channel_id);
    if (unassigned.length > 0) {
      const summaryId = "__channel____none__";
      const index = visibleChannels.length;
      normalized.push({
        id: summaryId,
        type: "task",
        tier: "branch",
        branchIndex: index,
        parentId: null,
        isChannelSummary: true,
        title: "Unsorted",
        channelHint: `${unassigned.length} task${unassigned.length === 1 ? "" : "s"}`,
        groupSize: unassigned.length,
        summaryChannelId: null,
        summaryChannelLabel: "Unsorted",
      });
      for (const task of unassigned) {
        normalized.push({
          ...task,
          tier: "leaf",
          branchIndex: index,
          parentId: summaryId,
        });
      }
    }
  }

  return normalized;
}

function filterNodesToChannel(treeNodes, channelId) {
  if (!channelId) return treeNodes;
  if (channelId === "unsorted") {
    const summaryId = "__channel____none__";
    return treeNodes.filter(
      (n) =>
        (n.isChannelSummary && n.summaryChannelId == null) ||
        (n.tier === "leaf" && !n.channel_id) ||
        n.parentId === summaryId,
    );
  }
  const summaryId = `__channel__${channelId}`;
  return treeNodes.filter(
    (n) =>
      (n.isChannelSummary && n.summaryChannelId === channelId) ||
      (n.tier === "leaf" && (n.channel_id === channelId || n.parentId === summaryId)),
  );
}

/** Drill-down: tasks in a responsive grid that fills the canvas width. */
function flatSingleChannelLayout(tasks, cx, topY, weekOrderIds, viewportWidth = 1100) {
  const ordered = sortSpanSiblings(tasks, weekOrderIds);
  if (!ordered.length) return [];

  const usableWidth = Math.max(viewportWidth * 0.92, COLUMN_WIDTH);
  const gap = Math.max(16, TASK_GAP);
  const maxCols = Math.max(1, Math.floor((usableWidth + gap) / (COLUMN_WIDTH + gap)));
  const cols = Math.min(maxCols, ordered.length);

  const gridWidth = cols * COLUMN_WIDTH + (cols - 1) * gap;
  const startX = cx - gridWidth / 2 + COLUMN_WIDTH / 2;
  const startY = topY + 24;

  return ordered.map((task, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      ...task,
      tier: "leaf",
      parentId: null,
      x: startX + col * (COLUMN_WIDTH + gap),
      y: startY + row * (TASK_CARD_HEIGHT + gap),
      branchIndex: 0,
      branchColor: branchColors()[0],
    };
  });
}

/** Flat layout: workstream columns with tasks stacked below each. */
function flatChannelLayout(treeNodes, cx = 500, topY = 80, weekOrderIds = null, layoutOptions = {}) {
  const filterChannelId = layoutOptions.filterChannelId ?? null;

  if (filterChannelId && !weekOrderIds?.length) {
    const scoped = filterNodesToChannel(treeNodes, filterChannelId);
    const tasks = scoped.filter(
      (n) => n.type === "task" && !n.isRollup && !n.isChannelSummary,
    );
    if (tasks.length) {
      return flatSingleChannelLayout(
        tasks,
        cx,
        topY,
        weekOrderIds,
        layoutOptions.viewportWidth ?? 1100,
      );
    }
  }

  let nodes = treeNodes;
  const channelSummaries = nodes.filter((n) => n.isChannelSummary);
  if (!channelSummaries.length && layoutOptions.channels?.length) {
    nodes = buildChannelColumnTree(
      treeNodes,
      layoutOptions.channels,
      layoutOptions.filterChannelId ?? null,
    );
  }

  const channels = nodes.filter((n) => n.isChannelSummary);
  if (!channels.length) return [];

  const weekIdSet = weekOrderIds ? new Set(weekOrderIds) : null;
  const sortedChannels = weekOrderIds
    ? [...channels].sort((a, b) => {
        const aHasWeek = nodes.some(
          (n) => n.tier === "leaf" && n.parentId === a.id && weekIdSet.has(n.id),
        );
        const bHasWeek = nodes.some(
          (n) => n.tier === "leaf" && n.parentId === b.id && weekIdSet.has(n.id),
        );
        if (aHasWeek && !bHasWeek) return -1;
        if (!aHasWeek && bHasWeek) return 1;
        return String(a.title || "").localeCompare(String(b.title || ""));
      })
    : channels;

  const branchMeta = layoutChannelColumns(sortedChannels, cx, topY, layoutOptions.viewportWidth ?? 1100);

  const leafMeta = new Map();
  const leavesByParent = new Map();
  for (const leaf of nodes.filter((n) => n.tier === "leaf")) {
    if (!leavesByParent.has(leaf.parentId)) leavesByParent.set(leaf.parentId, []);
    leavesByParent.get(leaf.parentId).push(leaf);
  }

  if (weekOrderIds?.length) {
    const weekGap = Math.max(COLUMN_WIDTH + 24, Math.min(280, 900 / weekOrderIds.length));
    const weekXs = rowPositions(weekOrderIds.length, cx, weekGap);
    const weekY = topY + CHANNEL_HEADER_HEIGHT + 20;

    weekOrderIds.forEach((id, index) => {
      const leaf = nodes.find((n) => n.id === id && n.tier === "leaf");
      if (!leaf) return;
      const parent = branchMeta.get(leaf.parentId);
      leafMeta.set(id, {
        x: weekXs[index],
        y: weekY,
        branchIndex: parent?.branchIndex ?? index,
        branchColor: parent?.color ?? branchColors()[index % branchColors().length],
      });
    });

    const columnStartY = weekY + TASK_CARD_HEIGHT + 48;
    for (const [parentId, siblings] of leavesByParent) {
      const parent = branchMeta.get(parentId);
      if (!parent) continue;
      const others = siblings.filter((n) => !weekIdSet.has(n.id));
      for (const leaf of others) {
        const pos = layoutLeafColumn(leaf, others, { ...parent, y: columnStartY }, weekOrderIds);
        if (pos) leafMeta.set(leaf.id, pos);
      }
    }
  } else {
    for (const [parentId, siblings] of leavesByParent) {
      const parent = branchMeta.get(parentId);
      if (!parent) continue;
      for (const leaf of siblings) {
        const pos = layoutLeafColumn(leaf, siblings, parent, weekOrderIds);
        if (pos) leafMeta.set(leaf.id, pos);
      }
    }
  }

  const positioned = [];
  for (const channel of sortedChannels) {
    const meta = branchMeta.get(channel.id);
    if (!meta) continue;
    positioned.push({ ...channel, ...meta, tier: "branch" });
  }
  for (const leaf of nodes.filter((n) => n.tier === "leaf")) {
    const pos = leafMeta.get(leaf.id);
    if (!pos) continue;
    positioned.push({ ...leaf, ...pos });
  }
  return positioned;
}

/** Position pre-built tree nodes. Uses flat layout when centerId is null. */
export function treeLayout(centerId, treeNodes, cx = 500, topY = 100, options = {}) {
  if (!centerId || options.flat) {
    return flatChannelLayout(treeNodes, cx, topY, options.weekOrderIds ?? null, options);
  }

  const hub = treeNodes.find((n) => n.id === centerId);
  if (!hub) return flatChannelLayout(treeNodes, cx, topY, options.weekOrderIds ?? null, options);

  const branches = treeNodes.filter((n) => n.tier === "branch" && n.parentId === centerId);
  const hubChildren = branches.filter((n) => !n.isChannelSummary);
  const branchesPerRow = Math.min(Math.max(hubChildren.length, 1), 4);
  const rowHeight = 190;
  const branchGap = Math.max(MIN_SPREAD, 720 / Math.max(hubChildren.length, 1));

  const branchMeta = new Map();
  const leafMeta = new Map();
  const firstRowY = topY + rowHeight;
  layoutBranchRow(hubChildren, branchMeta, {
    cx,
    startY: firstRowY,
    branchesPerRow,
    rowHeight,
    branchGap,
  });

  const leavesByParent = new Map();
  for (const leaf of treeNodes.filter((n) => n.tier === "leaf" && n.parentId !== centerId)) {
    if (!leavesByParent.has(leaf.parentId)) leavesByParent.set(leaf.parentId, []);
    leavesByParent.get(leaf.parentId).push(leaf);
  }

  for (const [parentId, siblings] of leavesByParent) {
    const parent = branchMeta.get(parentId);
    if (!parent) continue;
    for (const leaf of siblings) {
      const pos = layoutLeafColumn(leaf, siblings, parent);
      if (pos) leafMeta.set(leaf.id, pos);
    }
  }

  const positioned = [
    {
      ...hub,
      x: cx,
      y: topY,
      tier: "hub",
      branchIndex: -1,
      branchColor: branchColors()[0],
      isHub: true,
    },
  ];

  for (const branch of hubChildren) {
    const meta = branchMeta.get(branch.id);
    if (!meta) continue;
    positioned.push({ ...branch, ...meta });
  }

  for (const leaf of treeNodes.filter((n) => n.tier === "leaf")) {
    const pos = leafMeta.get(leaf.id);
    if (!pos) continue;
    positioned.push({ ...leaf, ...pos });
  }

  return positioned;
}

export { compareByPriorityAndFrequency };
