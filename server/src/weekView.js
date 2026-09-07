import { query, queryOne } from "./db.js";
import {
  buildWeekView,
  dateForWeekOffset,
  isCurrentWeekBounds,
  radialLayout,
  weekBounds,
} from "./week.js";
import { getManualWeekFocus, weekStartIso } from "./weekFocus.js";
import { ACTIVE_TASK_AND } from "./taskFilters.js";
import { MAP_TASK_COLUMNS } from "./mapView.js";

async function listChannels(projectId, { includeArchived = false } = {}) {
  const sql = includeArchived
    ? "SELECT * FROM channels WHERE project_id = ? ORDER BY archived, name"
    : "SELECT * FROM channels WHERE project_id = ? AND archived = 0 ORDER BY name";
  return query(sql, [projectId]);
}

export const DEFAULT_NEIGHBOR_LIMIT = 12;
export const MAX_NEIGHBOR_LIMIT = 48;

const PRIORITY_ORDER = `CASE priority WHEN 'p0' THEN 0 WHEN 'p1' THEN 1 WHEN 'p2' THEN 2 WHEN 'p3' THEN 3 ELSE 9 END`;
const DUE_DAY_EXPR = "substr(due_at, 1, 10)";

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

function weekCandidateSql(startDate, endDate) {
  return {
    sql: `(due_at IS NOT NULL AND due_at != '' AND ${DUE_DAY_EXPR} >= ? AND ${DUE_DAY_EXPR} < ?)`,
    params: [startDate, endDate],
  };
}

async function pickFocus(projectId, weekStartIso, startDate, endDate) {
  const manual = await getManualWeekFocus(projectId, weekStartIso);
  if (manual) return { focus: manual, usedFallback: false, pinned: true };

  const weekFilter = weekCandidateSql(startDate, endDate);

  const inWeek = await queryOne(
    `SELECT * FROM nodes
     WHERE project_id = ? AND type = 'task' ${ACTIVE_TASK_AND} AND ${weekFilter.sql}
     ORDER BY ${PRIORITY_ORDER}, due_at, estimate_hours, title
     LIMIT 1`,
    [projectId, ...weekFilter.params],
  );
  if (inWeek) return { focus: inWeek, usedFallback: false, pinned: false };

  return { focus: null, usedFallback: false, pinned: false };
}

async function countWeekTasks(projectId, startDate, endDate) {
  const weekFilter = weekCandidateSql(startDate, endDate);
  const row = await queryOne(
    `SELECT COUNT(*) AS count FROM nodes
     WHERE project_id = ? AND type = 'task' ${ACTIVE_TASK_AND} AND ${weekFilter.sql}`,
    [projectId, ...weekFilter.params],
  );
  return Number(row?.count) || 0;
}

async function countNeighbors(projectId, focus, startDate, endDate) {
  if (!focus) return 0;
  const weekFilter = weekCandidateSql(startDate, endDate);
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
  const weekFilter = weekCandidateSql(startDate, endDate);
  const rows = await query(
    `SELECT n.*,
       CASE
         WHEN e.id IS NOT NULL THEN 'linked'
         WHEN n.channel_id IS NOT NULL AND n.channel_id = ? THEN 'related'
         ELSE 'week'
       END AS neighbor_kind
     FROM nodes n
     LEFT JOIN edges e ON e.project_id = ? AND (
       (e.source_id = ? AND e.target_id = n.id) OR (e.target_id = ? AND e.source_id = n.id)
     )
     WHERE n.project_id = ? AND n.type = 'task' ${ACTIVE_TASK_AND} AND n.id != ?
       AND ${weekFilter.sql}
     ORDER BY
       CASE WHEN e.id IS NOT NULL THEN 0
            WHEN n.channel_id IS NOT NULL AND n.channel_id = ? THEN 1
            ELSE 2 END,
       ${PRIORITY_ORDER}, n.due_at, n.title
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

async function fetchCompletedInWeek(projectId, startDate, endDate) {
  return query(
    `SELECT ${MAP_TASK_COLUMNS} FROM nodes
     WHERE project_id = ? AND type = 'task'
       AND completed_at IS NOT NULL AND completed_at != ''
       AND substr(completed_at, 1, 10) >= ? AND substr(completed_at, 1, 10) < ?
     ORDER BY completed_at DESC, title`,
    [projectId, startDate, endDate],
  );
}

async function countCompletedInWeek(projectId, startDate, endDate) {
  const row = await queryOne(
    `SELECT COUNT(*) AS count FROM nodes
     WHERE project_id = ? AND type = 'task'
       AND completed_at IS NOT NULL AND completed_at != ''
       AND substr(completed_at, 1, 10) >= ? AND substr(completed_at, 1, 10) < ?`,
    [projectId, startDate, endDate],
  );
  return Number(row?.count) || 0;
}

async function fetchEdges(projectId, nodeIds) {
  if (nodeIds.length < 2) return [];
  const placeholders = nodeIds.map(() => "?").join(", ");
  return query(
    `SELECT * FROM edges
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
export async function buildWeekViewPaginated(projectId, { weekOffset = 0, neighborLimit, neighborOffset = 0 } = {}) {
  const limit = Math.min(Math.max(Number(neighborLimit) || DEFAULT_NEIGHBOR_LIMIT, 1), MAX_NEIGHBOR_LIMIT);
  const offset = Math.max(Number(neighborOffset) || 0, 0);
  const weekDate = dateForWeekOffset(weekOffset);
  const bounds = weekBounds(weekDate);
  const isCurrentWeek = isCurrentWeekBounds(bounds);
  const startIso = bounds.start.toISOString();
  const endIso = bounds.end.toISOString();
  const { startDate, endDate } = weekDateRange(bounds);

  const channels = await listChannels(projectId, { includeArchived: false });
  const weekTaskCount = await countWeekTasks(projectId, startDate, endDate);
  const completedCount = await countCompletedInWeek(projectId, startDate, endDate);
  const completedTasks = await fetchCompletedInWeek(projectId, startDate, endDate);
  const { focus, usedFallback, pinned } = await pickFocus(projectId, startIso, startDate, endDate);

  if (!focus) {
    return {
      weekStart: startIso,
      weekEnd: endIso,
      weekOffset,
      isCurrentWeek,
      focus: null,
      neighbors: [],
      neighborTotal: 0,
      neighborLimit: limit,
      neighborOffset: offset,
      weekTaskCount,
      taskCount: weekTaskCount,
      completedCount,
      completedTasks,
      nodes: [],
      edges: [],
      fallback: false,
      reason: buildReason({ focus: null, isCurrentWeek, channels, weekTaskCount, pinned: false }),
    };
  }

  const neighborTotal = await countNeighbors(projectId, focus, startDate, endDate);
  const neighbors = await fetchNeighbors(
    projectId,
    focus,
    startDate,
    endDate,
    limit,
    offset,
  );
  const nodeIds = [focus.id, ...neighbors.map((n) => n.id)];
  const edges = await fetchEdges(projectId, nodeIds);
  const nodes = radialLayout(focus.id, [focus, ...neighbors]);
  const laidOutFocus = nodes.find((n) => n.id === focus.id) || focus;

  return {
    weekStart: startIso,
    weekEnd: endIso,
    weekOffset,
    isCurrentWeek,
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
