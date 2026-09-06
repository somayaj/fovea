import { query, queryOne } from "./db.js";
import { MAP_TASK_COLUMNS } from "./mapView.js";

export const ROADMAP_DEFAULT_LIMIT = 24;
export const ROADMAP_MAX_LIMIT = 48;
export const ROADMAP_CALENDAR_PREVIEW_PER_DAY = 3;
export const ROADMAP_CALENDAR_DAY_PAGE_SIZE = 24;

const PRIORITY_ORDER = `CASE priority WHEN 'p0' THEN 0 WHEN 'p1' THEN 1 WHEN 'p2' THEN 2 WHEN 'p3' THEN 3 ELSE 9 END`;
const DUE_DAY_EXPR = "substr(due_at, 1, 10)";
const DUE_MONTH_EXPR = "substr(due_at, 1, 7)";
const DUE_YEAR_EXPR = "substr(due_at, 1, 4)";

function parseLimit(value) {
  const limit = Number(value) || ROADMAP_DEFAULT_LIMIT;
  return Math.min(Math.max(limit, 1), ROADMAP_MAX_LIMIT);
}

function parseOffset(value) {
  return Math.max(Number(value) || 0, 0);
}

export function monthBounds(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export function dayBounds(dayKey) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month - 1, day + 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export function yearBounds(year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export function monthKeysForYear(year) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
}

async function countMonthTasks(projectId, monthKey) {
  const row = await queryOne(
    `SELECT COUNT(*) AS count FROM nodes
     WHERE project_id = ? AND type = 'task'
       AND due_at IS NOT NULL AND ${DUE_MONTH_EXPR} = ?`,
    [projectId, monthKey],
  );
  return Number(row?.count) || 0;
}

async function fetchMonthTasks(projectId, monthKey, limit, offset) {
  return query(
    `SELECT ${MAP_TASK_COLUMNS} FROM nodes
     WHERE project_id = ? AND type = 'task'
       AND due_at IS NOT NULL AND ${DUE_MONTH_EXPR} = ?
     ORDER BY ${PRIORITY_ORDER}, due_at, title
     LIMIT ? OFFSET ?`,
    [projectId, monthKey, limit, offset],
  );
}

async function countUnscheduledTasks(projectId) {
  const row = await queryOne(
    `SELECT COUNT(*) AS count FROM nodes
     WHERE project_id = ? AND type = 'task' AND (due_at IS NULL OR due_at = '')`,
    [projectId],
  );
  return Number(row?.count) || 0;
}

async function fetchUnscheduledTasks(projectId, limit, offset) {
  return query(
    `SELECT ${MAP_TASK_COLUMNS} FROM nodes
     WHERE project_id = ? AND type = 'task' AND (due_at IS NULL OR due_at = '')
     ORDER BY ${PRIORITY_ORDER}, created_at, title
     LIMIT ? OFFSET ?`,
    [projectId, limit, offset],
  );
}

async function buildBucket(projectId, { bucket, year, limit, offset }) {
  if (bucket === "unscheduled") {
    const total = await countUnscheduledTasks(projectId);
    const tasks = await fetchUnscheduledTasks(projectId, limit, offset);
    return {
      key: "unscheduled",
      total,
      tasks,
      limit,
      offset,
      hasMore: offset + tasks.length < total,
    };
  }

  const monthKey = bucket || `${year}-01`;
  const total = await countMonthTasks(projectId, monthKey);
  const tasks = await fetchMonthTasks(projectId, monthKey, limit, offset);

  return {
    key: monthKey,
    total,
    tasks,
    limit,
    offset,
    hasMore: offset + tasks.length < total,
  };
}

/** Paginated tasks for one month or the unscheduled bucket. */
export async function buildRoadmapBucket(projectId, { bucket, year, limit, offset }) {
  return buildBucket(projectId, {
    bucket,
    year,
    limit: parseLimit(limit),
    offset: parseOffset(offset),
  });
}

/** Year overview — counts plus the first page of polaroids per month. */
export async function buildRoadmapYear(projectId, year, { limit = ROADMAP_DEFAULT_LIMIT } = {}) {
  const pageSize = parseLimit(limit);
  const monthKeys = monthKeysForYear(year);
  const months = [];

  for (const monthKey of monthKeys) {
    months.push(
      await buildBucket(projectId, {
        bucket: monthKey,
        year,
        limit: pageSize,
        offset: 0,
      }),
    );
  }

  const unscheduled = await buildBucket(projectId, {
    bucket: "unscheduled",
    year,
    limit: pageSize,
    offset: 0,
  });

  return {
    year,
    limit: pageSize,
    months,
    unscheduled,
  };
}

async function fetchDayCounts(projectId, { year, monthKey }) {
  const filter = year
    ? `${DUE_YEAR_EXPR} = ?`
    : `${DUE_MONTH_EXPR} = ?`;
  const value = year || monthKey;
  const rows = await query(
    `SELECT ${DUE_DAY_EXPR} AS day, COUNT(*) AS count
     FROM nodes
     WHERE project_id = ? AND type = 'task'
       AND due_at IS NOT NULL AND ${filter}
     GROUP BY ${DUE_DAY_EXPR}
     ORDER BY day`,
    [projectId, value],
  );
  return rows.map((row) => ({
    day: row.day,
    count: Number(row.count) || 0,
  }));
}

async function fetchDayPreviewTasks(projectId, monthKey, previewPerDay) {
  return query(
    `SELECT id, project_id, type, title, channel_id, priority, estimate_hours, due_at, image_url, category, created_at, day
     FROM (
       SELECT ${MAP_TASK_COLUMNS}, ${DUE_DAY_EXPR} AS day,
         ROW_NUMBER() OVER (
           PARTITION BY ${DUE_DAY_EXPR}
           ORDER BY ${PRIORITY_ORDER}, due_at, title
         ) AS rn
       FROM nodes
       WHERE project_id = ? AND type = 'task'
         AND due_at IS NOT NULL AND ${DUE_MONTH_EXPR} = ?
     ) ranked
     WHERE rn <= ?
     ORDER BY day, rn`,
    [projectId, monthKey, previewPerDay],
  );
}

/** Month heatmap — per-day counts plus a few preview tasks per busy day. */
export async function buildRoadmapCalendarMonth(
  projectId,
  monthKey,
  { previewPerDay = ROADMAP_CALENDAR_PREVIEW_PER_DAY } = {},
) {
  const preview = Math.min(Math.max(Number(previewPerDay) || ROADMAP_CALENDAR_PREVIEW_PER_DAY, 1), 5);
  const monthTotal = await countMonthTasks(projectId, monthKey);
  const counts = await fetchDayCounts(projectId, { monthKey });
  const previews = await fetchDayPreviewTasks(projectId, monthKey, preview);

  const days = {};
  for (const { day, count } of counts) {
    days[day] = { count, tasks: [] };
  }
  for (const task of previews) {
    const day = task.day;
    if (!days[day]) days[day] = { count: 0, tasks: [] };
    const { day: _day, ...node } = task;
    days[day].tasks.push(node);
  }

  return {
    monthKey,
    monthTotal,
    previewPerDay: preview,
    days,
  };
}

/** Year heatmap — per-day counts for all twelve months in one query. */
export async function buildRoadmapCalendarYear(projectId, year) {
  const counts = await fetchDayCounts(projectId, { year: String(year) });
  const monthKeys = monthKeysForYear(year);
  const days = {};
  const monthTotals = Object.fromEntries(monthKeys.map((monthKey) => [monthKey, 0]));
  let yearTotal = 0;

  for (const { day, count } of counts) {
    days[day] = count;
    yearTotal += count;
    const monthKey = day.slice(0, 7);
    if (monthTotals[monthKey] != null) {
      monthTotals[monthKey] += count;
    }
  }

  const unscheduledTotal = await countUnscheduledTasks(projectId);

  return {
    year,
    yearTotal,
    unscheduledTotal,
    monthTotals,
    days,
  };
}

/** Paginated tasks for one calendar day (drill-down). */
export async function buildRoadmapCalendarDay(
  projectId,
  dayKey,
  { limit = ROADMAP_CALENDAR_DAY_PAGE_SIZE, offset = 0 } = {},
) {
  const pageSize = parseLimit(limit);
  const pageOffset = parseOffset(offset);
  const total = await queryOne(
    `SELECT COUNT(*) AS count FROM nodes
     WHERE project_id = ? AND type = 'task'
       AND due_at IS NOT NULL AND ${DUE_DAY_EXPR} = ?`,
    [projectId, dayKey],
  );
  const tasks = await query(
    `SELECT ${MAP_TASK_COLUMNS} FROM nodes
     WHERE project_id = ? AND type = 'task'
       AND due_at IS NOT NULL AND ${DUE_DAY_EXPR} = ?
     ORDER BY ${PRIORITY_ORDER}, due_at, title
     LIMIT ? OFFSET ?`,
    [projectId, dayKey, pageSize, pageOffset],
  );
  const count = Number(total?.count) || 0;

  return {
    dayKey,
    total: count,
    tasks,
    limit: pageSize,
    offset: pageOffset,
    hasMore: pageOffset + tasks.length < count,
  };
}
