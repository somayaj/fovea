import { query, queryOne } from "./db.js";
import { countChannels, getChannel, listChannelsPaginated } from "./channels.js";
import { countUnsortedTasks } from "./taskCounts.js";

export const MAX_BRANCHES = 6;
export const MAX_LEAVES = 4;
export const MAX_OVERVIEW_CHANNELS = 48;
/** Visible task cards per workstream column on the overview map. */
export const MAX_TASKS_PER_CHANNEL = 12;
/** Paginated tasks when viewing a single workstream. */
export const MAP_CHANNEL_TASK_PAGE_SIZE = 24;

const PRIORITY_ORDER = `CASE priority WHEN 'p0' THEN 0 WHEN 'p1' THEN 1 WHEN 'p2' THEN 2 WHEN 'p3' THEN 3 ELSE 9 END`;
const PRIORITY_RANK_PARAM = `CASE ? WHEN 'p0' THEN 0 WHEN 'p1' THEN 1 WHEN 'p2' THEN 2 WHEN 'p3' THEN 3 ELSE 9 END`;

/** Columns needed for map cards — avoids loading notes blobs at scale. */
export const MAP_TASK_COLUMNS =
  "id, project_id, type, title, x, y, channel_id, priority, estimate_hours, due_at, image_url, category, recurrence_series_id, created_at";

/** 0-based rank of a task within its workstream (priority, then created_at). */
export async function taskRankInChannel(projectId, task) {
  const channelSql = task.channel_id ? "AND channel_id = ?" : "AND channel_id IS NULL";
  const priority = task.priority || "p2";
  const params = task.channel_id
    ? [projectId, task.channel_id, priority, priority, task.created_at]
    : [projectId, priority, priority, task.created_at];
  const row = await queryOne(
    `SELECT COUNT(*) AS rank FROM nodes
     WHERE project_id = ? AND type = 'task' ${channelSql}
     AND (
       (${PRIORITY_ORDER}) < (${PRIORITY_RANK_PARAM})
       OR ((${PRIORITY_ORDER}) = (${PRIORITY_RANK_PARAM}) AND created_at < ?)
     )`,
    params,
  );
  return Number(row?.rank) || 0;
}

export function taskPageForRank(rank, pageSize = MAP_CHANNEL_TASK_PAGE_SIZE) {
  return Math.floor(rank / pageSize);
}

export function isUnsortedChannelFilter(filterChannel) {
  return filterChannel === "unsorted" || filterChannel === "__unsorted__";
}

export function resolveFilterChannelId(filterChannel) {
  if (!filterChannel || isUnsortedChannelFilter(filterChannel)) return null;
  return filterChannel;
}

function rollupId(kind, key = "") {
  return `__rollup__${kind}__${key}`;
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

function channelKey(channelId) {
  return channelId || "__none__";
}

function scopeFilter(scope, filterChannel) {
  if (filterChannel) {
    if (isUnsortedChannelFilter(filterChannel)) {
      return { sql: "AND channel_id IS NULL", params: [] };
    }
    return { sql: "AND channel_id = ?", params: [filterChannel] };
  }
  if (scope?.type === "channel") {
    if (scope.channelId) {
      return { sql: "AND channel_id = ?", params: [scope.channelId] };
    }
    return { sql: "AND channel_id IS NULL", params: [] };
  }
  return { sql: "", params: [] };
}

async function countTasks(projectId, scope, filterChannel) {
  const { sql, params } = scopeFilter(scope, filterChannel);
  const row = await queryOne(
    `SELECT COUNT(*) AS count FROM nodes WHERE project_id = ? AND type = 'task' ${sql}`,
    [projectId, ...params],
  );
  return Number(row?.count) || 0;
}

async function fetchTopTasksForChannel(projectId, channelId, limit) {
  const channelSql = channelId ? "AND channel_id = ?" : "AND channel_id IS NULL";
  const params = channelId ? [projectId, channelId, limit] : [projectId, limit];
  return query(
    `SELECT ${MAP_TASK_COLUMNS} FROM nodes
     WHERE project_id = ? AND type = 'task' ${channelSql}
     ORDER BY ${PRIORITY_ORDER}, created_at
     LIMIT ?`,
    params,
  );
}

async function pickCenterId(projectId, scope, filterChannel, weekFocusId) {
  const { sql, params } = scopeFilter(scope, filterChannel);

  if (weekFocusId) {
    const focus = await queryOne(
      `SELECT id FROM nodes WHERE project_id = ? AND id = ? AND type = 'task' ${sql}`,
      [projectId, weekFocusId, ...params],
    );
    if (focus) return focus.id;
  }

  const top = await queryOne(
    `SELECT id FROM nodes
     WHERE project_id = ? AND type = 'task' ${sql}
     ORDER BY ${PRIORITY_ORDER}, created_at
     LIMIT 1`,
    [projectId, ...params],
  );
  return top?.id || null;
}

async function fetchNode(projectId, nodeId) {
  return queryOne("SELECT * FROM nodes WHERE project_id = ? AND id = ?", [projectId, nodeId]);
}

async function channelLabel(channels, channelId) {
  if (!channelId) return "Unsorted";
  return channels.find((c) => c.id === channelId)?.name || "Channel";
}

function channelLabelSync(channels, channelId) {
  if (!channelId) return "Unsorted";
  return channels.find((c) => c.id === channelId)?.name || "Channel";
}

async function buildChannelScopeTree(projectId, centerId, scope, channels) {
  const channelId = scope.channelId;
  const channelFilter = channelId
    ? { sql: "AND channel_id = ?", params: [channelId] }
    : { sql: "AND channel_id IS NULL", params: [] };

  const totalRow = await queryOne(
    `SELECT COUNT(*) AS count FROM nodes
     WHERE project_id = ? AND type = 'task' AND id != ? ${channelFilter.sql}`,
    [projectId, centerId, ...channelFilter.params],
  );
  const total = Number(totalRow?.count) || 0;
  const limit = scope.expanded ? total : MAX_BRANCHES;
  const branchOverflow = scope.expanded ? 0 : Math.max(0, total - MAX_BRANCHES);

  const branches = await query(
    `SELECT * FROM nodes
     WHERE project_id = ? AND type = 'task' AND id != ? ${channelFilter.sql}
     ORDER BY ${PRIORITY_ORDER}, created_at
     LIMIT ?`,
    [projectId, centerId, ...channelFilter.params, limit],
  );

  const ideas = await query(
    `SELECT * FROM nodes
     WHERE project_id = ? AND type = 'idea' AND id != ? ${channelFilter.sql}
     ORDER BY created_at`,
    [projectId, centerId, ...channelFilter.params],
  );

  const treeNodes = [];
  let branchIndex = 0;
  for (const node of branches) {
    treeNodes.push({
      ...node,
      tier: "branch",
      branchIndex: branchIndex++,
      parentId: centerId,
    });
  }

  if (branchOverflow > 0) {
    treeNodes.push(
      makeRollup({
        kind: "tasks-more",
        key: channelId || "all",
        title: `+ ${branchOverflow} more tasks`,
        tier: "branch",
        parentId: centerId,
        count: branchOverflow,
        channelId,
        branchIndex: branchIndex++,
      }),
    );
  }

  for (const idea of ideas) {
    treeNodes.push({
      ...idea,
      tier: "branch",
      branchIndex: branchIndex++,
      parentId: centerId,
    });
  }

  return treeNodes;
}

async function fetchIdeaCounts(projectId) {
  const rows = await query(
    `SELECT COALESCE(channel_id, '__none__') AS ck, COUNT(*) AS count
     FROM nodes WHERE project_id = ? AND type = 'idea'
     GROUP BY COALESCE(channel_id, '__none__')`,
    [projectId],
  );
  return Object.fromEntries(rows.map((r) => [r.ck, Number(r.count) || 0]));
}

function channelSummaryId(channelId) {
  return `__channel__${channelKey(channelId)}`;
}

async function buildOverviewScopeTree(projectId, { filterChannel, channelPage = 0, channelLimit = MAX_OVERVIEW_CHANNELS }) {
  const treeNodes = [];

  if (filterChannel) {
    if (!isUnsortedChannelFilter(filterChannel)) {
      const channel = await getChannel(projectId, filterChannel);
      if (!channel || channel.archived) return treeNodes;
    }

    const channelId = resolveFilterChannelId(filterChannel);
    const groupSize = channelId
      ? (await getChannel(projectId, channelId))?.tasks ?? 0
      : await countUnsortedTasks(projectId);
    const label = channelId ? (await getChannel(projectId, channelId))?.name || "Channel" : "Unsorted";
    treeNodes.push({
      id: channelSummaryId(channelId),
      type: "task",
      tier: "branch",
      branchIndex: 0,
      parentId: null,
      isChannelSummary: true,
      title: label,
      channelHint: groupSize > 0 ? `${groupSize.toLocaleString()} task${groupSize === 1 ? "" : "s"}` : "No tasks yet",
      groupSize,
      summaryChannelId: channelId,
      summaryChannelLabel: label,
    });
    return treeNodes;
  }

  const offset = channelPage * channelLimit;
  const { channels, total, hasMore } = await listChannelsPaginated(projectId, {
    limit: channelLimit,
    offset,
  });

  let branchIndex = 0;
  for (const channel of channels) {
    const groupSize = Number(channel.tasks) || 0;
    treeNodes.push({
      id: channelSummaryId(channel.id),
      type: "task",
      tier: "branch",
      branchIndex: branchIndex++,
      parentId: null,
      isChannelSummary: true,
      title: channel.name,
      channelHint: groupSize > 0 ? `${groupSize.toLocaleString()} task${groupSize === 1 ? "" : "s"}` : "No tasks yet",
      groupSize,
      summaryChannelId: channel.id,
      summaryChannelLabel: channel.name,
    });
  }

  if (channelPage === 0) {
    const unassignedCount = await countUnsortedTasks(projectId);
    if (unassignedCount > 0) {
      treeNodes.push({
        id: channelSummaryId(null),
        type: "task",
        tier: "branch",
        branchIndex: branchIndex++,
        parentId: null,
        isChannelSummary: true,
        title: "Unsorted",
        channelHint: `${unassignedCount.toLocaleString()} task${unassignedCount === 1 ? "" : "s"}`,
        groupSize: unassignedCount,
        summaryChannelId: null,
        summaryChannelLabel: "Unsorted",
      });
    }
  }

  if (hasMore) {
    const remaining = total - offset - channels.length;
    treeNodes.push(
      makeRollup({
        kind: "channels",
        key: String(channelPage + 1),
        title: `+ ${remaining.toLocaleString()} more workstreams`,
        tier: "branch",
        parentId: null,
        count: remaining,
        channelPage: channelPage + 1,
      }),
    );
  }

  return treeNodes;
}

function appendChannelRollups(treeNodes, summaries) {
  const loadedByChannel = new Map();
  for (const node of treeNodes) {
    if (node.tier !== "leaf" || node.isRollup) continue;
    const ck = channelKey(node.channel_id);
    loadedByChannel.set(ck, (loadedByChannel.get(ck) || 0) + 1);
  }

  for (const summary of summaries) {
    const ck = channelKey(summary.summaryChannelId);
    const loaded = loadedByChannel.get(ck) || 0;
    const overflow = Math.max(0, (summary.groupSize || 0) - loaded);
    if (overflow <= 0) continue;
    treeNodes.push(
      makeRollup({
        kind: "channel-tasks",
        key: ck,
        title: `+ ${overflow.toLocaleString()} more`,
        tier: "leaf",
        parentId: summary.id,
        count: overflow,
        channelId: summary.summaryChannelId,
      }),
    );
  }
}

async function attachOverviewChildren(
  treeNodes,
  projectId,
  { filterChannel, maxTasksPerChannel = MAX_TASKS_PER_CHANNEL, taskPage = 0, taskPageSize = MAP_CHANNEL_TASK_PAGE_SIZE } = {},
) {
  const summaries = treeNodes.filter((n) => n.isChannelSummary);
  if (!summaries.length) return { taskPagination: null };

  const summaryByKey = new Map(
    summaries.map((s) => [channelKey(s.summaryChannelId), s]),
  );

  if (filterChannel) {
    const summary = summaries[0];
    if (!summary) return { taskPagination: null };
    const channelFilter = summary.summaryChannelId
      ? { sql: "AND channel_id = ?", params: [summary.summaryChannelId] }
      : { sql: "AND channel_id IS NULL", params: [] };
    const offset = taskPage * taskPageSize;
    const total = summary.groupSize || 0;
    const tasks = await query(
      `SELECT ${MAP_TASK_COLUMNS} FROM nodes
       WHERE project_id = ? AND type = 'task' ${channelFilter.sql}
       ORDER BY ${PRIORITY_ORDER}, created_at
       LIMIT ? OFFSET ?`,
      [projectId, ...channelFilter.params, taskPageSize, offset],
    );
    for (const child of tasks) {
      treeNodes.push({
        ...child,
        tier: "leaf",
        branchIndex: summary.branchIndex,
        parentId: summary.id,
      });
    }
    const remaining = Math.max(0, total - offset - tasks.length);
    if (remaining > 0) {
      treeNodes.push(
        makeRollup({
          kind: "channel-tasks",
          key: channelKey(summary.summaryChannelId),
          title: `+ ${remaining.toLocaleString()} more`,
          tier: "leaf",
          parentId: summary.id,
          count: remaining,
          channelId: summary.summaryChannelId,
        }),
      );
    }
    return {
      taskPagination: {
        page: taskPage,
        limit: taskPageSize,
        total,
        hasMore: offset + tasks.length < total,
      },
    };
  }

  const channelIds = summaries
    .map((s) => s.summaryChannelId)
    .filter((id) => id != null);
  const includeUnsorted = summaryByKey.has("__none__");

  const taskBatches = await Promise.all([
    ...channelIds.map((channelId) =>
      fetchTopTasksForChannel(projectId, channelId, maxTasksPerChannel).then((tasks) =>
        tasks.map((child) => ({ child, summary: summaryByKey.get(channelKey(channelId)) })),
      ),
    ),
    ...(includeUnsorted
      ? [
          fetchTopTasksForChannel(projectId, null, maxTasksPerChannel).then((tasks) =>
            tasks.map((child) => ({ child, summary: summaryByKey.get("__none__") })),
          ),
        ]
      : []),
  ]);

  for (const batch of taskBatches) {
    for (const { child, summary } of batch) {
      if (!summary) continue;
      treeNodes.push({
        ...child,
        tier: "leaf",
        branchIndex: summary.branchIndex,
        parentId: summary.id,
      });
    }
  }

  appendChannelRollups(treeNodes, summaries);
  return { taskPagination: null };
}

async function buildRootScopeTree(projectId, centerId, scope, channels, filterChannel) {
  const { sql, params } = scopeFilter(scope, filterChannel);
  const channelPage = scope.channelPage || 0;
  const offset = channelPage * MAX_BRANCHES;

  const leaders = await query(
    `WITH scoped AS (
       SELECT * FROM nodes
       WHERE project_id = ? AND type = 'task' AND id != ? ${sql}
     ),
     ranked AS (
       SELECT *,
         ROW_NUMBER() OVER (
           PARTITION BY COALESCE(channel_id, '__none__')
           ORDER BY ${PRIORITY_ORDER}, created_at
         ) AS rn,
         COUNT(*) OVER (PARTITION BY COALESCE(channel_id, '__none__')) AS group_count
       FROM scoped
     )
     SELECT * FROM ranked WHERE rn = 1
     ORDER BY ${PRIORITY_ORDER}, created_at
     LIMIT ? OFFSET ?`,
    [projectId, centerId, ...params, MAX_BRANCHES, offset],
  );

  const groupCountRow = await queryOne(
    `WITH scoped AS (
       SELECT COALESCE(channel_id, '__none__') AS ck FROM nodes
       WHERE project_id = ? AND type = 'task' AND id != ? ${sql}
     )
     SELECT COUNT(DISTINCT ck) AS count FROM scoped`,
    [projectId, centerId, ...params],
  );
  const totalGroups = Number(groupCountRow?.count) || 0;
  const remainingChannels = Math.max(0, totalGroups - offset - leaders.length);

  const treeNodes = [];

  for (let i = 0; i < leaders.length; i += 1) {
    const branchRep = leaders[i];
    const ck = channelKey(branchRep.channel_id);
    const groupSize = Number(branchRep.group_count) || 1;
    const label = await channelLabel(channels, branchRep.channel_id);

    treeNodes.push({
      ...branchRep,
      tier: "branch",
      branchIndex: i,
      parentId: centerId,
      channelHint: `#${label}`,
      groupSize,
    });

    const leaves = await query(
      `WITH scoped AS (
         SELECT * FROM nodes
         WHERE project_id = ? AND type = 'task' AND id != ? ${sql}
       ),
       ranked AS (
         SELECT *,
           ROW_NUMBER() OVER (
             PARTITION BY COALESCE(channel_id, '__none__')
             ORDER BY ${PRIORITY_ORDER}, created_at
           ) AS rn
         FROM scoped
       )
       SELECT * FROM ranked
       WHERE COALESCE(channel_id, '__none__') = ? AND rn BETWEEN 2 AND ?`,
      [projectId, centerId, ...params, ck, MAX_LEAVES + 1],
    );

    const leafOverflow = Math.max(0, groupSize - 1 - leaves.length);

    for (const leaf of leaves) {
      treeNodes.push({
        ...leaf,
        tier: "leaf",
        branchIndex: i,
        parentId: branchRep.id,
      });
    }

    if (leafOverflow > 0) {
      treeNodes.push(
        makeRollup({
          kind: "channel-more",
          key: branchRep.channel_id || "none",
          title: `+ ${leafOverflow} more`,
          tier: "leaf",
          parentId: branchRep.id,
          count: leafOverflow,
          channelId: branchRep.channel_id,
        }),
      );
    }
  }

  if (remainingChannels > 0) {
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

  return treeNodes;
}

async function placeIdeas(treeNodes, projectId, centerId, scope) {
  if (scope?.type === "channel" || scope?.type === "overview") return;

  const ideas = await query(
    `SELECT * FROM nodes
     WHERE project_id = ? AND type = 'idea' AND id != ?
     ORDER BY created_at`,
    [projectId, centerId],
  );

  const byChannel = new Map();
  const unassigned = [];
  for (const idea of ideas) {
    if (idea.channel_id) {
      const ck = channelKey(idea.channel_id);
      if (!byChannel.has(ck)) byChannel.set(ck, []);
      byChannel.get(ck).push(idea);
    } else {
      unassigned.push(idea);
    }
  }

  const channelBranches = treeNodes.filter(
    (n) =>
      n.tier === "branch" &&
      n.parentId === centerId &&
      (n.isChannelSummary || n.channel_id != null),
  );

  for (const branch of channelBranches) {
    const channelId = branch.isChannelSummary ? branch.summaryChannelId : branch.channel_id;
    const channelIdeas = byChannel.get(channelKey(channelId)) || [];
    for (const idea of channelIdeas) {
      treeNodes.push({
        ...idea,
        tier: "leaf",
        branchIndex: branch.branchIndex,
        parentId: branch.id,
      });
    }
    byChannel.delete(channelKey(channelId));
  }

  let branchIndex = treeNodes.filter((n) => n.tier === "branch" && n.parentId === centerId).length;
  for (const channelIdeas of byChannel.values()) {
    for (const idea of channelIdeas) {
      treeNodes.push({
        ...idea,
        tier: "branch",
        branchIndex,
        parentId: centerId,
      });
      branchIndex += 1;
    }
  }

  for (const idea of unassigned) {
    treeNodes.push({
      ...idea,
      tier: "branch",
      branchIndex,
      parentId: centerId,
    });
    branchIndex += 1;
  }
}

export async function buildMapView(
  projectId,
  { scope, filterChannel, channelPage = 0, channelLimit = MAX_OVERVIEW_CHANNELS, taskPage = 0 } = {},
) {
  const channelMeta =
    filterChannel && !isUnsortedChannelFilter(filterChannel)
      ? await getChannel(projectId, filterChannel)
      : null;
  const effectiveScope =
    filterChannel && scope?.type !== "channel"
      ? {
          type: "channel",
          channelId: resolveFilterChannelId(filterChannel),
          label: channelMeta?.name || (isUnsortedChannelFilter(filterChannel) ? "Unsorted" : "Channel"),
          expanded: scope?.expanded,
        }
      : scope || { type: "overview" };

  const totalTasks = await countTasks(projectId, effectiveScope, filterChannel);

  const treeNodes = await buildOverviewScopeTree(projectId, {
    filterChannel,
    channelPage,
    channelLimit,
  });
  const { taskPagination } = await attachOverviewChildren(treeNodes, projectId, {
    filterChannel,
    taskPage,
  });
  const visibleCount = treeNodes.filter((n) => !n.isRollup).length;

  let channelPagination = null;
  if (!filterChannel) {
    const total = await countChannels(projectId);
    const offset = channelPage * channelLimit;
    channelPagination = {
      page: channelPage,
      limit: channelLimit,
      offset,
      total,
      hasMore: offset + channelLimit < total,
    };
  }

  return {
    centerId: null,
    treeNodes,
    totalTasks,
    visibleCount,
    scope: effectiveScope,
    channelPagination,
    taskPagination,
  };
}
