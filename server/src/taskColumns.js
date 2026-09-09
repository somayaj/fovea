/** Columns needed for map cards — avoids loading notes blobs at scale. */
export const MAP_TASK_COLUMNS =
  "id, project_id, type, title, x, y, channel_id, priority, estimate_hours, due_at, image_url, category, recurrence_series_id, created_at, completed_at";

/** Week cards need notes for the task panel without SELECT *. */
export const WEEK_TASK_COLUMNS = `${MAP_TASK_COLUMNS}, notes`;
