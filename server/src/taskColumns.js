/** List/card columns — never select image_url; that TOAST-detoasts data-URL photos. */
export const MAP_TASK_COLUMNS =
  "id, project_id, type, title, x, y, channel_id, priority, estimate_hours, due_at, category, recurrence_series_id, created_at, completed_at, has_custom_photo, photo_rev";

/** Week cards need notes for the task panel without SELECT *. */
export const WEEK_TASK_COLUMNS = `${MAP_TASK_COLUMNS}, notes`;

/** Auth/update columns — still no image_url. */
export const NODE_CORE_COLUMNS = `${WEEK_TASK_COLUMNS}, archived`;

function qualifyColumns(columns, alias) {
  const prefix = alias ? `${alias}.` : "";
  return columns.split(", ").map((column) => `${prefix}${column}`).join(", ");
}

export function nodeColumns(alias = "") {
  return qualifyColumns(NODE_CORE_COLUMNS, alias);
}

/** Qualify WEEK_TASK_COLUMNS with a table alias — required whenever the query JOINs
 * another table, since several of these columns (notably `id`, `created_at`) collide
 * with columns on other tables (e.g. `projects`, `users`). */
export function weekTaskColumns(alias = "") {
  return qualifyColumns(WEEK_TASK_COLUMNS, alias);
}
