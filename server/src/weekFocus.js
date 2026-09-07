import { execute, queryOne } from "./db.js";
import { weekBounds, dateForWeekOffset } from "./week.js";

export function weekStartIso(weekOffset = 0) {
  const bounds = weekBounds(dateForWeekOffset(weekOffset));
  return bounds.start.toISOString();
}

export async function getManualWeekFocus(projectId, weekStartIso) {
  const project = await queryOne(
    `SELECT week_focus_task_id, week_focus_week_start FROM projects WHERE id = ?`,
    [projectId],
  );
  if (!project?.week_focus_task_id || project.week_focus_week_start !== weekStartIso) {
    return null;
  }
  return queryOne(
    `SELECT * FROM nodes WHERE id = ? AND project_id = ? AND type = 'task'
       AND (completed_at IS NULL OR completed_at = '')`,
    [project.week_focus_task_id, projectId],
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
