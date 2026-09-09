import { query, queryOne } from "./db.js";
import {
  buildWeekView,
  dateForWeekOffset,
  isCurrentWeekBounds,
  radialLayout,
  weekBounds,
} from "./week.js";
import { getCurrentWeekFocus } from "./weekFocus.js";
import { ACTIVE_TASK_AND } from "./taskFilters.js";
import { WEEK_TASK_COLUMNS } from "./taskColumns.js";

async function listChannelsForIds(projectId, ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return [];
  const placeholders = unique.map(() => "?").join(", ");
  return query(
    `SELECT * FROM channels WHERE project_id = ? AND id IN (${placeholders})`,
    [projectId, ...unique],
  );
}

export const DEFAULT_NEIGHBOR_LIMIT = 12;
export const MAX_NEIGHBOR_LIMIT = 48;
export const RECAP_DEFAULT_LIMIT = 24;
export const RECAP_MAX_LIMIT = 100;

const PRIORITY_ORDER = `CASE priority WHEN 'p0' THEN 0 WHEN 'p1' THEN 1 WHEN 'p2' THEN 2 WHEN 'p3' THEN 3 ELSE 9 END`;

function formatLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function weekDateRange(bounds) {
  return {
    startDate: formatLocalDateKey(bounds.start),
    endDate: formatLocalDateKey(bounds.end),
  };
}

/** Inclusive start / exclusive end on ISO date strings so due_at can use an index. */
function weekRangeSql(column, startDate, endDate) {
  return {
    sql: `${column} >= ? AND ${column} < ?`,
    params: [startDate, endDate],
  };
}

async function countWeekTasks(projectId, startDate, endDate) {
  const weekFilter = weekRangeSql("due_at", startDate, endDate);
  const row = await queryOne(
    `SELECT COUNT(*) AS count FROM nodes
     WHERE project_id = ? AND type = 'task' ${ACTIVE_TASK_AND} AND ${weekFilter.sql}`,
    [projectId, ...weekFilter.params],
  );
  return Number(row?.count) || 0;
}

async function countNeighbors(projectId, focus, startDate, endDate) {
  if (!focus) return 0;
  const weekFilter = weekRangeSql("due_at", startDate, endDate);
  const row = await queryOne(
    `SELECT COUNT(*) AS count FROM nodes
     WHERE project_id = ? AND type = 'task' ${ACTIVE_TASK_AND} AND id != ?
       AND ${weekFilter.sql}`,
    [projectId, focus.id, ...weekFilter.params],
  );
  return Number(row?.count) || 0;
}

async function fetchNeighbors(projectId, focus, startDate, endDate, limit, offset) {
  if (!focus) return [];
  const weekFilter = weekRangeSql("due_at", startDate, endDate);
  return query(
    `SELECT ${WEEK_TASK_COLUMNS} FROM nodes
     WHERE project_id = ? AND type = 'task' ${ACTIVE_TASK_AND} AND id != ?
       AND ${weekFilter.sql}
     ORDER BY ${PRIORITY_ORDER}, due_at, title
     LIMIT ? OFFSET ?`,
    [projectId, focus.id, ...weekFilter.params, limit, offset],
  );
}

function withNeighborKind(neighbors, focus, edges) {
  const linked = new Set();
  for (const edge of edges) {
    if (edge.source_id === focus.id) linked.add(edge.target_id);
    if (edge.target_id === focus.id) linked.add(edge.source_id);
  }
  return neighbors.map((node) => ({
    ...node,
    neighborKind: linked.has(node.id)
      ? "linked"
      : node.channel_id && node.channel_id === focus.channel_id
        ? "related"
        : "week",
  }));
}

async function fetchCompletedInWeek(projectId, startDate, endDate, limit, offset) {
  const completedFilter = weekRangeSql("completed_at", startDate, endDate);
  return query(
    `SELECT ${WEEK_TASK_COLUMNS} FROM nodes
     WHERE project_id = ? AND type = 'task'
       AND ${completedFilter.sql}
     ORDER BY completed_at DESC, title
     LIMIT ? OFFSET ?`,
    [projectId, ...completedFilter.params, limit, offset],
  );
}

async function countCompletedInWeek(projectId, startDate, endDate) {
  const completedFilter = weekRangeSql("completed_at", startDate, endDate);
  const row = await queryOne(
    `SELECT COUNT(*) AS count FROM nodes
     WHERE project_id = ? AND type = 'task'
       AND ${completedFilter.sql}`,
    [projectId, ...completedFilter.params],
  );
  return Number(row?.count) || 0;
}

async function fetchEdges(projectId, nodeIds) {
  if (nodeIds.length < 2) return [];
  const placeholders = nodeIds.map(() => "?").join(", ");
  return query(
    `SELECT id, project_id, source_id, target_id FROM edges
     WHERE project_id = ? AND source_id IN (${placeholders}) AND target_id IN (${placeholders})`,
    [projectId, ...nodeIds, ...nodeIds],
  );
}

function buildReason({ focus, isCurrentWeek, channels, weekTaskCount, pinned }) {
  if (!focus) {
    if (isCurrentWeek) {
      return weekTaskCount > 0
        ? `${weekTaskCount} task${weekTaskCount === 1 ? "" : "s"} due this week — pick one as your focus.`
        : "Nothing is due this week yet. Set a due date on a task to see it here.";
    }
    return weekTaskCount > 0
      ? `${weekTaskCount} task${weekTaskCount === 1 ? "" : "s"} were due that week.`
      : "No tasks were due that week.";
  }
  if (pinned) {
    const channelName = channels.find((c) => c.id === focus.channel_id)?.name;
    return channelName
      ? `You chose this as this week's focus · #${channelName}.`
      : "You chose this as this week's focus.";
  }
  const channelName = channels.find((c) => c.id === focus.channel_id)?.name;
  const countLabel =
    weekTaskCount > 1
      ? `${weekTaskCount} task${weekTaskCount === 1 ? "" : "s"} due this week`
      : "1 task due this week";
  if (channelName) {
    return `${countLabel} · focus is #${channelName} (${focus.priority?.toUpperCase() || "unranked"}).`;
  }
  return `${countLabel} · ${focus.priority?.toUpperCase() || "unranked"} priority.`;
}

/** SQL-backed week view — scales to large task counts. */
export async function buildWeekViewPaginated(
  projectId,
  { weekOffset = 0, neighborLimit, neighborOffset = 0, completedLimit, completedOffset = 0 } = {},
) {
  const limit = Math.min(Math.max(Number(neighborLimit) || DEFAULT_NEIGHBOR_LIMIT, 1), MAX_NEIGHBOR_LIMIT);
  const offset = Math.max(Number(neighborOffset) || 0, 0);
  const parsedCompleted = Number(completedLimit);
  const recapLimit =
    completedLimit == null || Number.isNaN(parsedCompleted)
      ? RECAP_DEFAULT_LIMIT
      : Math.min(Math.max(parsedCompleted, 0), RECAP_MAX_LIMIT);
  const recapOffset = Math.max(Number(completedOffset) || 0, 0);
  const weekDate = dateForWeekOffset(weekOffset);
  const bounds = weekBounds(weekDate);
  const isCurrentWeek = isCurrentWeekBounds(bounds);
  const startIso = bounds.start.toISOString();
  const endIso = bounds.end.toISOString();
  const { startDate, endDate } = weekDateRange(bounds);

  const skipRecap = recapLimit === 0;
  const [weekTaskCount, completedCount, completedTasks, focusResult] = await Promise.all([
    countWeekTasks(projectId, startDate, endDate),
    skipRecap ? 0 : countCompletedInWeek(projectId, startDate, endDate),
    skipRecap
      ? []
      : fetchCompletedInWeek(projectId, startDate, endDate, recapLimit, recapOffset),
    getCurrentWeekFocus(projectId, weekOffset),
  ]);
  const hasMoreCompleted = recapOffset + completedTasks.length < completedCount;
  const { focus, pinned } = focusResult;

  if (!focus) {
    const channels = await listChannelsForIds(
      projectId,
      completedTasks.map((task) => task.channel_id),
    );
    return {
      weekStart: startIso,
      weekEnd: endIso,
      weekOffset,
      isCurrentWeek,
      channels,
      focus: null,
      neighbors: [],
      neighborTotal: 0,
      neighborLimit: limit,
      neighborOffset: offset,
      weekTaskCount,
      taskCount: weekTaskCount,
      completedCount,
      completedTasks,
      completedLimit: recapLimit,
      completedOffset: recapOffset,
      hasMoreCompleted,
      nodes: [],
      edges: [],
      fallback: false,
      reason: buildReason({ focus: null, isCurrentWeek, channels, weekTaskCount, pinned: false }),
    };
  }

  const [neighborTotal, rawNeighbors] = await Promise.all([
    countNeighbors(projectId, focus, startDate, endDate),
    fetchNeighbors(projectId, focus, startDate, endDate, limit, offset),
  ]);
  const nodeIds = [focus.id, ...rawNeighbors.map((n) => n.id)];
  const [channels, edges] = await Promise.all([
    listChannelsForIds(projectId, [
      focus.channel_id,
      ...rawNeighbors.map((node) => node.channel_id),
      ...completedTasks.map((task) => task.channel_id),
    ]),
    fetchEdges(projectId, nodeIds),
  ]);
  const neighbors = withNeighborKind(rawNeighbors, focus, edges);
  const nodes = radialLayout(focus.id, [focus, ...neighbors]);
  const laidOutFocus = nodes.find((n) => n.id === focus.id) || focus;

  return {
    weekStart: startIso,
    weekEnd: endIso,
    weekOffset,
    isCurrentWeek,
    channels,
    focus: laidOutFocus,
    focusPinned: pinned,
    neighbors: nodes.filter((n) => n.id !== focus.id),
    neighborTotal,
    neighborLimit: limit,
    neighborOffset: offset,
    weekTaskCount,
    taskCount: weekTaskCount,
    completedCount,
    completedTasks,
    completedLimit: recapLimit,
    completedOffset: recapOffset,
    hasMoreCompleted,
    nodes,
    edges,
    fallback: false,
    reason: buildReason({ focus, isCurrentWeek, channels, weekTaskCount, pinned }),
  };
}

export async function buildWeekRecap(
  projectId,
  { weekOffset = 0, completedLimit, completedOffset = 0 } = {},
) {
  const parsedCompleted = Number(completedLimit);
  const recapLimit =
    completedLimit == null || Number.isNaN(parsedCompleted)
      ? RECAP_DEFAULT_LIMIT
      : Math.min(Math.max(parsedCompleted, 0), RECAP_MAX_LIMIT);
  const recapOffset = Math.max(Number(completedOffset) || 0, 0);
  const bounds = weekBounds(dateForWeekOffset(weekOffset));
  const { startDate, endDate } = weekDateRange(bounds);
  if (recapLimit === 0) {
    return {
      completedCount: 0,
      completedTasks: [],
      completedLimit: 0,
      completedOffset: recapOffset,
      hasMoreCompleted: false,
      channels: [],
    };
  }
  const [completedCount, completedTasks] = await Promise.all([
    countCompletedInWeek(projectId, startDate, endDate),
    fetchCompletedInWeek(projectId, startDate, endDate, recapLimit, recapOffset),
  ]);
  const channels = await listChannelsForIds(
    projectId,
    completedTasks.map((task) => task.channel_id),
  );
  return {
    completedCount,
    completedTasks,
    completedLimit: recapLimit,
    completedOffset: recapOffset,
    hasMoreCompleted: recapOffset + completedTasks.length < completedCount,
    channels,
  };
}

/** Legacy in-memory path for tests and small payloads. */
export function buildWeekViewLegacy(projectId, nodes, edges, channels, options) {
  const raw = buildWeekView({ nodes, edges, channels, ...options });
  if (!raw.focus) return raw;
  const laidOut = radialLayout(raw.focus.id, raw.nodes);
  return {
    ...raw,
    nodes: laidOut,
    focus: laidOut.find((n) => n.id === raw.focus.id) || raw.focus,
    neighbors: laidOut.filter((n) => n.id !== raw.focus.id),
    neighborTotal: raw.neighbors.length,
    neighborLimit: raw.neighbors.length,
    neighborOffset: 0,
    weekTaskCount: null,
    taskCount: nodes.filter((n) => n.type === "task").length,
  };
}
