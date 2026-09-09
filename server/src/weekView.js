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

const WEEK_TASK_COLUMNS_N = WEEK_TASK_COLUMNS.split(", ")
  .map((column) => `n.${column}`)
  .join(", ");

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

const PRIORITY_ORDER_N = `CASE n.priority WHEN 'p0' THEN 0 WHEN 'p1' THEN 1 WHEN 'p2' THEN 2 WHEN 'p3' THEN 3 ELSE 9 END`;

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
  const weekFilter = weekRangeSql("n.due_at", startDate, endDate);
  const rows = await query(
    `SELECT ${WEEK_TASK_COLUMNS_N},
       CASE
         WHEN e.id IS NOT NULL THEN 'linked'
         WHEN n.channel_id IS NOT NULL AND n.channel_id = ? THEN 'related'
         ELSE 'week'
       END AS neighbor_kind
     FROM nodes n
     LEFT JOIN edges e ON e.project_id = ? AND (
       (e.source_id = ? AND e.target_id = n.id) OR (e.target_id = ? AND e.source_id = n.id)
     )
     WHERE n.project_id = ? AND n.type = 'task'
       AND (n.completed_at IS NULL OR n.completed_at = '') AND (n.archived IS NULL OR n.archived = 0)
       AND n.id != ?
       AND ${weekFilter.sql}
     ORDER BY
       CASE WHEN e.id IS NOT NULL THEN 0
            WHEN n.channel_id IS NOT NULL AND n.channel_id = ? THEN 1
            ELSE 2 END,
       ${PRIORITY_ORDER_N}, n.due_at, n.title
     LIMIT ? OFFSET ?`,
    [
      focus.channel_id,
      projectId,
      focus.id,
      focus.id,
      projectId,
      focus.id,
      ...weekFilter.params,
      focus.channel_id,
      limit,
      offset,
    ],
  );
  return rows.map(({ neighbor_kind, ...node }) => ({ ...node, neighborKind: neighbor_kind }));
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

  const [neighborTotal, neighbors] = await Promise.all([
    countNeighbors(projectId, focus, startDate, endDate),
    fetchNeighbors(projectId, focus, startDate, endDate, limit, offset),
  ]);
  const channels = await listChannelsForIds(projectId, [
    focus.channel_id,
    ...neighbors.map((node) => node.channel_id),
    ...completedTasks.map((task) => task.channel_id),
  ]);
  const nodeIds = [focus.id, ...neighbors.map((n) => n.id)];
  const edges = await fetchEdges(projectId, nodeIds);
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
