import { execute, query, queryOne } from "./db.js";

export async function countUnsortedTasks(projectId) {
  const row = await queryOne(
    `SELECT COUNT(*) AS count FROM nodes
     WHERE project_id = ? AND type = 'task'
       AND completed_at IS NULL
       AND archived = 0
       AND channel_id IS NULL`,
    [projectId],
  );
  return Number(row?.count) || 0;
}

export async function adjustChannelTaskCount(channelId, delta) {
  if (!channelId || !delta) return;
  await execute(
    `UPDATE channels SET task_count = CASE WHEN task_count + ? < 0 THEN 0 ELSE task_count + ? END WHERE id = ?`,
    [delta, delta, channelId],
  );
}

export async function onTaskCreated({ type, channel_id }) {
  if (type !== "task" || !channel_id) return;
  await adjustChannelTaskCount(channel_id, 1);
}

export async function onTaskDeleted({ type, channel_id, completed_at }) {
  if (type !== "task" || !channel_id || completed_at) return;
  await adjustChannelTaskCount(channel_id, -1);
}

export async function onTaskUpdated(before, after) {
  const wasActive =
    before?.type === "task" && !before.completed_at && !Number(before.archived);
  const isActive =
    after?.type === "task" && !after.completed_at && !Number(after.archived);

  if (wasActive && before.channel_id && (!isActive || before.channel_id !== after.channel_id)) {
    await adjustChannelTaskCount(before.channel_id, -1);
  }
  if (isActive && after.channel_id && (!wasActive || before.channel_id !== after.channel_id)) {
    await adjustChannelTaskCount(after.channel_id, 1);
  }
}

export async function onTaskCompletionChanged(before, after) {
  if (before?.type !== "task" || after?.type !== "task") return;
  const wasComplete = Boolean(before.completed_at);
  const isComplete = Boolean(after.completed_at);
  if (wasComplete === isComplete) return;
  const channelId = after.channel_id || before.channel_id;
  if (!channelId) return;
  await adjustChannelTaskCount(channelId, isComplete ? -1 : 1);
}

export async function onChannelArchived(channelId, movedCount) {
  if (!channelId || !movedCount) return;
  await adjustChannelTaskCount(channelId, -movedCount);
}

export async function backfillChannelTaskCounts(projectId) {
  await execute(
    `UPDATE channels SET task_count = (
       SELECT COUNT(*) FROM nodes n
       WHERE n.channel_id = channels.id AND n.project_id = channels.project_id
         AND n.type = 'task'
         AND n.completed_at IS NULL
         AND n.archived = 0
     )
     WHERE project_id = ?`,
    [projectId],
  );
}

export async function backfillAllChannelTaskCounts() {
  const projects = await query("SELECT id FROM projects");
  for (const { id } of projects) {
    await backfillChannelTaskCounts(id);
  }
}
