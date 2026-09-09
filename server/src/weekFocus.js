import { execute, queryOne } from "./db.js";
import { weekBounds, dateForWeekOffset } from "./week.js";
import { WEEK_TASK_COLUMNS } from "./taskColumns.js";
import { ACTIVE_TASK_AND } from "./taskFilters.js";

const PRIORITY_ORDER = `CASE priority WHEN 'p0' THEN 0 WHEN 'p1' THEN 1 WHEN 'p2' THEN 2 WHEN 'p3' THEN 3 ELSE 9 END`;

function formatLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function weekDateRange(bounds) {
  return {
    startDate: formatLocalDateKey(bounds.start),
    endDate: formatLocalDateKey(bounds.end),
  };
}

export function weekStartIso(weekOffset = 0) {
  const bounds = weekBounds(dateForWeekOffset(weekOffset));
  return bounds.start.toISOString();
}

export async function getCurrentWeekFocus(projectId, weekOffset = 0) {
  const bounds = weekBounds(dateForWeekOffset(weekOffset));
  const startIso = bounds.start.toISOString();
  const { startDate, endDate } = weekDateRange(bounds);
  const manual = await getManualWeekFocus(projectId, startIso);
  if (manual) return { focus: manual, pinned: true };

  const focus = await queryOne(
    `SELECT ${WEEK_TASK_COLUMNS} FROM nodes
     WHERE project_id = ? AND type = 'task' ${ACTIVE_TASK_AND}
       AND due_at >= ? AND due_at < ?
     ORDER BY ${PRIORITY_ORDER}, due_at, estimate_hours, title
     LIMIT 1`,
    [projectId, startDate, endDate],
  );
  return { focus: focus || null, pinned: false };
}

export async function getManualWeekFocus(projectId, weekStartIso) {
  return queryOne(
    `SELECT ${WEEK_TASK_COLUMNS} FROM nodes n
     JOIN projects p ON p.id = n.project_id
     WHERE p.id = ? AND p.week_focus_week_start = ? AND p.week_focus_task_id = n.id
       AND n.type = 'task' AND n.completed_at IS NULL AND n.archived = 0`,
    [projectId, weekStartIso],
  );
}

export async function setManualWeekFocus(projectId, taskId, weekStartIso) {
  await execute(
    `UPDATE projects SET week_focus_task_id = ?, week_focus_week_start = ? WHERE id = ?`,
    [taskId, weekStartIso, projectId],
  );
}

export async function clearManualWeekFocus(projectId) {
  await execute(
    `UPDATE projects SET week_focus_task_id = NULL, week_focus_week_start = NULL WHERE id = ?`,
    [projectId],
  );
}

export async function clearWeekFocusIfTask(projectId, taskId) {
  const project = await queryOne(
    `SELECT week_focus_task_id FROM projects WHERE id = ?`,
    [projectId],
  );
  if (project?.week_focus_task_id === taskId) {
    await clearManualWeekFocus(projectId);
  }
}
