/** List/card columns — never select image_url; that TOAST-detoasts data-URL photos. */
export const MAP_TASK_COLUMNS =
  "id, project_id, type, title, x, y, channel_id, priority, estimate_hours, due_at, category, recurrence_series_id, created_at, completed_at, has_custom_photo, photo_rev";

/** Week cards need notes for the task panel without SELECT *. */
export const WEEK_TASK_COLUMNS = `${MAP_TASK_COLUMNS}, notes`;

/** Auth/update columns — still no image_url. */
export const NODE_CORE_COLUMNS = `${WEEK_TASK_COLUMNS}, archived`;

export function nodeColumns(alias = "") {
  const prefix = alias ? `${alias}.` : "";
  return NODE_CORE_COLUMNS.split(", ").map((column) => `${prefix}${column}`).join(", ");
}
