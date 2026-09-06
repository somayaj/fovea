import { compareByPriorityAndFrequency } from "./radialLayout.js";

export const MAX_BRANCHES = 6;
export const MAX_LEAVES = 4;

export function rollupId(kind, key = "") {
  return `__rollup__${kind}__${key}`;
}

export function isRollupId(id) {
  return String(id).startsWith("__rollup__");
}

export function parseRollupId(id) {
  const parts = String(id).split("__").filter(Boolean);
  return { kind: parts[1], key: parts[2] || "" };
}

function neighborsOf(nodeId, edges) {
  const ids = new Set();
  for (const edge of edges || []) {
    if (edge.source_id === nodeId) ids.add(edge.target_id);
    if (edge.target_id === nodeId) ids.add(edge.source_id);
  }
  return ids;
}

function sortNodes(nodes, edges) {
  return [...nodes].sort((a, b) => compareByPriorityAndFrequency(a, b, edges));
}

function channelLabel(channelId, channels) {
  if (!channelId) return "Unsorted";
  return channels.find((c) => c.id === channelId)?.name || "Channel";
}

function groupByChannel(nodes, channels) {
  const groups = new Map();
  for (const node of nodes) {
    const key = node.channel_id || "__none__";
    if (!groups.has(key)) {
      groups.set(key, {
        channelId: node.channel_id || null,
        label: channelLabel(node.channel_id, channels),
        nodes: [],
      });
    }
    groups.get(key).nodes.push(node);
  }

  return [...groups.values()]
    .map((g) => ({ ...g, nodes: sortNodes(g.nodes, []) }))
    .sort((a, b) => compareByPriorityAndFrequency(a.nodes[0], b.nodes[0], []));
}

function makeRollup({ kind, key, title, tier, parentId, count, channelId, channelPage }) {
  return {
    id: rollupId(kind, key),
    type: "rollup",
    title,
    isRollup: true,
    rollupKind: kind,
    rollupCount: count,
    rollupChannelId: channelId ?? null,
    rollupChannelPage: channelPage ?? 0,
    tier,
    parentId,
  };
}

/** Build capped tree nodes + rollup placeholders for layout. */
export function buildRollupTree({
  nodes,
  edges,
  centerId,
  channels,
  scope = { type: "root", channelPage: 0 },
}) {
  const center = nodes.find((n) => n.id === centerId);
  if (!center) return { treeNodes: [], hiddenCounts: { branches: 0, leaves: 0 } };

  const treeNodes = [
    {
      ...center,
      tier: "hub",
      isHub: true,
      branchIndex: -1,
    },
  ];

  let hiddenBranches = 0;
  let hiddenLeaves = 0;

  const others = sortNodes(
    nodes.filter((n) => n.id !== centerId),
    edges,
  );

  if (scope.type === "channel") {
    const branches = scope.expanded ? others : others.slice(0, MAX_BRANCHES);
    const branchOverflow = scope.expanded ? 0 : others.length - branches.length;

    branches.forEach((node, i) => {
      treeNodes.push({
        ...node,
        tier: "branch",
        branchIndex: i,
        parentId: centerId,
      });
    });

    if (branchOverflow > 0) {
      hiddenBranches = branchOverflow;
      treeNodes.push(
        makeRollup({
          kind: "tasks-more",
          key: scope.channelId || "all",
          title: `+ ${branchOverflow} more`,
          tier: "branch",
          parentId: centerId,
          count: branchOverflow,
          channelId: scope.channelId,
        }),
      );
    }

    return { treeNodes, hiddenCounts: { branches: hiddenBranches, leaves: hiddenLeaves } };
  }

  const channelPage = scope.channelPage || 0;
  const groups = groupByChannel(others, channels);
  const pageStart = channelPage * MAX_BRANCHES;
  const pageGroups = groups.slice(pageStart, pageStart + MAX_BRANCHES);
  const remainingChannels = groups.length - pageStart - pageGroups.length;

  pageGroups.forEach((group, i) => {
    const [branchRep, ...rest] = group.nodes;
    if (!branchRep) return;

    const branchIndex = i;
    treeNodes.push({
      ...branchRep,
      tier: "branch",
      branchIndex,
      parentId: centerId,
      channelHint: `#${group.label}`,
      groupSize: group.nodes.length,
    });

    const leaves = rest.slice(0, MAX_LEAVES);
    const leafOverflow = rest.length - leaves.length;

    leaves.forEach((leaf) => {
      treeNodes.push({
        ...leaf,
        tier: "leaf",
        branchIndex,
        parentId: branchRep.id,
      });
    });

    if (leafOverflow > 0) {
      hiddenLeaves += leafOverflow;
      treeNodes.push(
        makeRollup({
          kind: "channel-more",
          key: group.channelId || "none",
          title: `+ ${leafOverflow} more`,
          tier: "leaf",
          parentId: branchRep.id,
          count: leafOverflow,
          channelId: group.channelId,
        }),
      );
    }
  });

  if (remainingChannels > 0) {
    hiddenBranches += remainingChannels;
    treeNodes.push(
      makeRollup({
        kind: "channels",
        key: String(channelPage + 1),
        title: `+ ${remainingChannels} channels`,
        tier: "branch",
        parentId: centerId,
        count: remainingChannels,
        channelPage: channelPage + 1,
      }),
    );
  }

  return { treeNodes, hiddenCounts: { branches: hiddenBranches, leaves: hiddenLeaves } };
}

export function scopeForChannel(channelId, channelName, { expanded = false } = {}) {
  return { type: "channel", channelId, label: channelName || "Unsorted", expanded };
}

export function scopeRoot(channelPage = 0) {
  return { type: "root", channelPage };
}

export function scopeOverview() {
  return { type: "overview" };
}

export function filterNodesForScope(nodes, scope) {
  if (scope.type === "channel") {
    if (scope.channelId) {
      return nodes.filter((n) => n.channel_id === scope.channelId);
    }
    return nodes.filter((n) => !n.channel_id);
  }
  return nodes;
}

export function summarizeMap(nodes, channels) {
  const tasks = nodes.filter((n) => n.type === "task");
  const byChannel = {};
  const byPriority = { p0: 0, p1: 0, p2: 0, p3: 0 };

  for (const task of tasks) {
    if (task.channel_id) {
      byChannel[task.channel_id] = (byChannel[task.channel_id] || 0) + 1;
    }
    if (task.priority && byPriority[task.priority] != null) {
      byPriority[task.priority] += 1;
    }
  }

  return {
    totalTasks: tasks.length,
    channelCounts: byChannel,
    priorityCounts: byPriority,
    channelSummaries: channels.map((c) => ({
      id: c.id,
      name: c.name,
      tasks: byChannel[c.id] || 0,
    })),
  };
}
