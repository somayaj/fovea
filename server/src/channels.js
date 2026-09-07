import { query, queryOne } from "./db.js";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function channelWhere(projectId, { q = "", includeArchived = false, archivedOnly = false } = {}) {
  const params = [projectId];
  let sql = "WHERE c.project_id = ?";
  if (archivedOnly) {
    sql += " AND c.archived = 1";
  } else if (!includeArchived) {
    sql += " AND c.archived = 0";
  }
  if (q) {
    sql += " AND LOWER(c.name) LIKE LOWER(?)";
    params.push(`%${q}%`);
  }
  return { sql, params };
}

export async function countChannels(projectId, options = {}) {
  const { sql, params } = channelWhere(projectId, options);
  const row = await queryOne(
    `SELECT COUNT(*) AS count FROM channels c ${sql}`,
    params,
  );
  return Number(row?.count) || 0;
}

export async function listChannelsPaginated(
  projectId,
  { q = "", limit = DEFAULT_LIMIT, offset = 0, includeArchived = false, archivedOnly = false } = {},
) {
  const safeLimit = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const { sql, params } = channelWhere(projectId, { q, includeArchived, archivedOnly });

  const channels = await query(
    `SELECT c.id, c.project_id, c.name, c.slug, c.archived, c.created_at, c.task_count AS tasks
     FROM channels c
     ${sql}
     ORDER BY c.archived ASC, c.name ASC
     LIMIT ? OFFSET ?`,
    [...params, safeLimit, safeOffset],
  );

  const total = await countChannels(projectId, { q, includeArchived, archivedOnly });

  return {
    channels: channels.map((c) => ({
      ...c,
      archived: Number(c.archived) || 0,
      tasks: Number(c.tasks) || 0,
    })),
    total,
    limit: safeLimit,
    offset: safeOffset,
    hasMore: safeOffset + channels.length < total,
  };
}

export async function getChannel(projectId, channelId) {
  if (!channelId) return null;
  const row = await queryOne(
    `SELECT c.*, c.task_count AS tasks
     FROM channels c
     WHERE c.project_id = ? AND c.id = ?`,
    [projectId, channelId],
  );
  if (!row) return null;
  return {
    ...row,
    archived: Number(row.archived) || 0,
    tasks: Number(row.tasks) || 0,
  };
}

export async function channelNameMap(projectId, channelIds = []) {
  if (!channelIds.length) return {};
  const placeholders = channelIds.map(() => "?").join(",");
  const rows = await query(
    `SELECT id, name FROM channels WHERE project_id = ? AND id IN (${placeholders})`,
    [projectId, ...channelIds],
  );
  return Object.fromEntries(rows.map((r) => [r.id, r.name]));
}
