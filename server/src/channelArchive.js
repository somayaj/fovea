import { execute, query, withTransaction } from "./db.js";
import { backfillChannelTaskCounts } from "./taskCounts.js";
import { clearWeekFocusIfTask } from "./weekFocus.js";

/** Archive a workstream and all its tasks (restorable). */
export async function archiveChannelWithTasks(projectId, channelId) {
  const tasks = await query(
    `SELECT id FROM nodes WHERE project_id = ? AND channel_id = ? AND type = 'task'`,
    [projectId, channelId],
  );

  await withTransaction(async (tx) => {
    await tx.execute("UPDATE channels SET archived = 1 WHERE id = ? AND project_id = ?", [
      channelId,
      projectId,
    ]);
    await tx.execute(
      `UPDATE nodes SET archived = 1 WHERE project_id = ? AND channel_id = ?`,
      [projectId, channelId],
    );
  });

  for (const task of tasks) {
    await clearWeekFocusIfTask(projectId, task.id);
  }

  await backfillChannelTaskCounts(projectId);
}

/** Restore a workstream and all its tasks. */
export async function restoreChannelWithTasks(projectId, channelId) {
  await withTransaction(async (tx) => {
    await tx.execute("UPDATE channels SET archived = 0 WHERE id = ? AND project_id = ?", [
      channelId,
      projectId,
    ]);
    await tx.execute(
      `UPDATE nodes SET archived = 0 WHERE project_id = ? AND channel_id = ?`,
      [projectId, channelId],
    );
  });

  await backfillChannelTaskCounts(projectId);
}

/** Permanently delete a workstream and all nodes in it. */
export async function deleteChannelWithTasks(projectId, channelId) {
  const nodes = await query("SELECT id, type FROM nodes WHERE channel_id = ? AND project_id = ?", [
    channelId,
    projectId,
  ]);
  const nodeIds = nodes.map((n) => n.id);

  await withTransaction(async (tx) => {
    if (nodeIds.length > 0) {
      const placeholders = nodeIds.map(() => "?").join(",");
      await tx.execute(
        `DELETE FROM edges WHERE source_id IN (${placeholders}) OR target_id IN (${placeholders})`,
        [...nodeIds, ...nodeIds],
      );
      for (const nodeId of nodeIds) {
        await tx.execute("DELETE FROM nodes WHERE id = ?", [nodeId]);
      }
    }
    await tx.execute("DELETE FROM channels WHERE id = ? AND project_id = ?", [channelId, projectId]);
  });

  for (const node of nodes) {
    if (node.type === "task") {
      await clearWeekFocusIfTask(projectId, node.id);
    }
  }

  await backfillChannelTaskCounts(projectId);
}
