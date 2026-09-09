/** List/card columns — skip image_url so data-URL photos do not bloat payloads. */
export const MAP_TASK_COLUMNS =
  "id, project_id, type, title, x, y, channel_id, priority, estimate_hours, due_at, category, recurrence_series_id, created_at, completed_at, CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 ELSE 0 END AS has_custom_photo";

/** Week cards need notes for the task panel without SELECT *. */
export const WEEK_TASK_COLUMNS = `${MAP_TASK_COLUMNS}, notes`;
