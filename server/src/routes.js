import { randomUUID } from "node:crypto";
import { Router } from "express";
import { execute, nowIso, query, queryOne, slugify, withTransaction } from "./db.js";
import { requireAuth } from "./auth.js";
import { isAdminUser, requireAdmin, revealUser, summarizeUser } from "./admin.js";
import {
  buildMapView,
  isUnsortedChannelFilter,
  MAP_CHANNEL_TASK_PAGE_SIZE,
  MAP_TASK_COLUMNS,
  taskPageForRank,
  taskRankInChannel,
} from "./mapView.js";
import { channelNameMap, getChannel, listChannelsPaginated } from "./channels.js";
import { buildWeekViewPaginated } from "./weekView.js";
import {
  clearManualWeekFocus,
  clearWeekFocusIfTask,
  setManualWeekFocus,
  weekStartIso,
} from "./weekFocus.js";
import {
  createRecurringTasks,
  deleteRecurrenceSeries,
  FREQUENCIES,
  getRecurrenceSeries,
} from "./recurrence.js";
import {
  onTaskCreated,
  onTaskDeleted,
  onTaskUpdated,
} from "./taskCounts.js";

const router = Router();
router.use(requireAuth);

async function userProject(userId, projectId) {
  return queryOne("SELECT * FROM projects WHERE id = ? AND user_id = ?", [projectId, userId]);
}

async function listChannels(projectId, { includeArchived = true } = {}) {
  const sql = includeArchived
    ? "SELECT * FROM channels WHERE project_id = ? ORDER BY archived, name"
    : "SELECT * FROM channels WHERE project_id = ? AND archived = 0 ORDER BY name";
  return query(sql, [projectId]);
}

async function listNodes(projectId) {
  return query("SELECT * FROM nodes WHERE project_id = ?", [projectId]);
}

async function listEdges(projectId) {
  return query("SELECT * FROM edges WHERE project_id = ?", [projectId]);
}

async function channelCounts(projectId) {
  return query(
    `SELECT channel_id, COUNT(*) AS tasks
     FROM nodes
     WHERE project_id = ? AND type = 'task' AND channel_id IS NOT NULL
     GROUP BY channel_id`,
    [projectId],
  );
}

router.get("/me", async (req, res) => {
  const project = await queryOne("SELECT * FROM projects WHERE user_id = ?", [req.user.id]);
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar,
      isAdmin: isAdminUser(req.user),
    },
    project,
  });
});

router.get("/admin/users", requireAdmin, async (_req, res) => {
  const users = await query(
    "SELECT id, email, name, avatar, google_sub, created_at, last_login_at FROM users ORDER BY COALESCE(last_login_at, created_at) DESC",
  );
  res.json({
    count: users.length,
    users: users.map(summarizeUser),
  });
});

router.get("/admin/users/:id", requireAdmin, async (req, res) => {
  const user = await queryOne(
    "SELECT id, email, name, avatar, google_sub, created_at, last_login_at FROM users WHERE id = ?",
    [req.params.id],
  );
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: revealUser(user) });
});

router.get("/projects", async (req, res) => {
  const projects = await query("SELECT * FROM projects WHERE user_id = ?", [req.user.id]);
  res.json({ projects });
});

router.post("/projects", async (req, res) => {
  const name = String(req.body?.name || "Untitled").trim() || "Untitled";
  const project = {
    id: randomUUID(),
    user_id: req.user.id,
    name,
    created_at: nowIso(),
  };
  await execute("INSERT INTO projects (id, user_id, name, created_at) VALUES (?, ?, ?, ?)", [
    project.id,
    project.user_id,
    project.name,
    project.created_at,
  ]);
  res.status(201).json({ project });
});

router.get("/projects/:id/map", async (req, res) => {
  const project = await userProject(req.user.id, req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });
  res.json({
    project,
    nodes: [],
    edges: [],
    channels: await listChannels(project.id),
    deprecated: true,
    message: "Use /map/view, /tasks, or /ideas instead",
  });
});

router.get("/projects/:id/ideas", async (req, res) => {
  const project = await userProject(req.user.id, req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });
  const ideas = await query(
    `SELECT id, project_id, type, title, notes, x, y, channel_id, created_at
     FROM nodes WHERE project_id = ? AND type = 'idea' ORDER BY created_at`,
    [project.id],
  );
  const edges = await query(
    `SELECT e.id, e.project_id, e.source_id, e.target_id
     FROM edges e
     JOIN nodes s ON s.id = e.source_id AND s.type = 'idea'
     JOIN nodes t ON t.id = e.target_id AND t.type = 'idea'
     WHERE e.project_id = ?`,
    [project.id],
  );
  res.json({ ideas, edges });
});

router.get("/projects/:id/map/view", async (req, res) => {
  const project = await userProject(req.user.id, req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  let scope = { type: "root", channelPage: 0 };
  if (req.query.scope) {
    try {
      scope = JSON.parse(req.query.scope);
    } catch {
      return res.status(400).json({ error: "Invalid scope" });
    }
  }

  const channelPage = Math.max(Number(req.query.channelPage) || 0, 0);
  const taskPage = Math.max(Number(req.query.taskPage) || 0, 0);
  const filterChannel = req.query.channel || null;
  const weekFocusId = req.query.weekFocus || null;

  const view = await buildMapView(project.id, {
    scope,
    filterChannel,
    weekFocusId,
    channelPage,
    taskPage,
  });

  const activeChannel =
    filterChannel && isUnsortedChannelFilter(filterChannel)
      ? { id: null, name: "Unsorted" }
      : filterChannel
        ? await getChannel(project.id, filterChannel)
        : null;

  res.json({
    project,
    activeChannel,
    ...view,
  });
});

router.get("/projects/:id/tasks", async (req, res) => {
  const project = await userProject(req.user.id, req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const channelId = req.query.channel || null;
  const params = [project.id];
  let channelSql = "";
  if (channelId) {
    channelSql = "AND channel_id = ?";
    params.push(channelId);
  }
  const nodes = await query(
    `SELECT ${MAP_TASK_COLUMNS}, notes FROM nodes
     WHERE project_id = ? AND type = 'task' ${channelSql}
     ORDER BY CASE priority WHEN 'p0' THEN 0 WHEN 'p1' THEN 1 WHEN 'p2' THEN 2 WHEN 'p3' THEN 3 ELSE 9 END, created_at
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const total = await queryOne(
    `SELECT COUNT(*) AS count FROM nodes WHERE project_id = ? AND type = 'task' ${channelSql}`,
    params,
  );
  res.json({
    nodes,
    total: Number(total?.count) || 0,
    limit,
    offset,
    hasMore: offset + nodes.length < (Number(total?.count) || 0),
  });
});

router.get("/projects/:id/search", async (req, res) => {
  const project = await userProject(req.user.id, req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const q = String(req.query.q || "").trim();
  const limit = Math.min(Number(req.query.limit) || 15, 30);
  if (q.length < 2) {
    return res.json({ results: [], query: q });
  }

  const like = `%${q}%`;
  const compactLike = `%${q.replace(/,/g, "")}%`;
  const prefix = `${q}%`;
  const nodes = await query(
    `SELECT id, project_id, type, title, notes, x, y, channel_id, priority, estimate_hours, due_at, image_url, category, created_at
     FROM nodes
     WHERE project_id = ? AND type = 'task'
       AND (
         LOWER(title) LIKE LOWER(?)
         OR REPLACE(LOWER(title), ',', '') LIKE LOWER(?)
         OR LOWER(notes) LIKE LOWER(?)
       )
     ORDER BY
       CASE WHEN LOWER(title) LIKE LOWER(?) THEN 0 ELSE 1 END,
       CASE priority WHEN 'p0' THEN 0 WHEN 'p1' THEN 1 WHEN 'p2' THEN 2 WHEN 'p3' THEN 3 ELSE 9 END,
       title
     LIMIT ?`,
    [project.id, like, compactLike, like, prefix, limit],
  );

  const channelIds = [...new Set(nodes.map((n) => n.channel_id).filter(Boolean))];
  const channelNames = await channelNameMap(project.id, channelIds);

  const results = await Promise.all(
    nodes.map(async (node) => {
      const rank = await taskRankInChannel(project.id, node);
      return {
        ...node,
        channelName: node.channel_id ? channelNames[node.channel_id] || "Channel" : "Unsorted",
        mapTaskPage: taskPageForRank(rank, MAP_CHANNEL_TASK_PAGE_SIZE),
      };
    }),
  );

  res.json({ query: q, results });
});

router.put("/projects/:id/map", async (req, res) => {
  const project = await userProject(req.user.id, req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });
  const positions = Array.isArray(req.body?.nodes) ? req.body.nodes : [];
  await withTransaction(async (tx) => {
    for (const node of positions) {
      if (!node.id || typeof node.x !== "number" || typeof node.y !== "number") continue;
      await tx.execute("UPDATE nodes SET x = ?, y = ? WHERE id = ? AND project_id = ?", [
        node.x,
        node.y,
        node.id,
        project.id,
      ]);
    }
  });
  res.json({ project, ok: true });
});

router.get("/projects/:id/channels", async (req, res) => {
  const project = await userProject(req.user.id, req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });
  const q = String(req.query.q || "").trim();
  const limit = req.query.limit;
  const offset = req.query.offset;
  const result = await listChannelsPaginated(project.id, { q, limit, offset });
  res.json(result);
});

router.get("/channels/:channelId", async (req, res) => {
  const channel = await queryOne("SELECT * FROM channels WHERE id = ?", [req.params.channelId]);
  if (!channel) return res.status(404).json({ error: "Channel not found" });
  const project = await userProject(req.user.id, channel.project_id);
  if (!project) return res.status(404).json({ error: "Channel not found" });
  const full = await getChannel(project.id, channel.id);
  res.json({ channel: full });
});

router.post("/projects/:id/channels", async (req, res) => {
  const project = await userProject(req.user.id, req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Channel name is required" });
  const channel = {
    id: randomUUID(),
    project_id: project.id,
    name,
    slug: slugify(name),
    archived: 0,
    created_at: nowIso(),
  };
  await execute(
    "INSERT INTO channels (id, project_id, name, slug, archived, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [channel.id, channel.project_id, channel.name, channel.slug, channel.archived, channel.created_at],
  );
  res.status(201).json({ channel: { ...channel, tasks: 0 } });
});

router.patch("/channels/:channelId", async (req, res) => {
  const channel = await queryOne("SELECT * FROM channels WHERE id = ?", [req.params.channelId]);
  if (!channel) return res.status(404).json({ error: "Channel not found" });
  const project = await userProject(req.user.id, channel.project_id);
  if (!project) return res.status(404).json({ error: "Channel not found" });
  const name = req.body?.name != null ? String(req.body.name).trim() : channel.name;
  if (!name) return res.status(400).json({ error: "Channel name is required" });
  const archived = req.body?.archived == null ? channel.archived : req.body.archived ? 1 : 0;
  await execute("UPDATE channels SET name = ?, slug = ?, archived = ? WHERE id = ?", [
    name,
    slugify(name),
    archived,
    channel.id,
  ]);
  res.json({ channel: await queryOne("SELECT * FROM channels WHERE id = ?", [channel.id]) });
});

router.delete("/channels/:channelId", async (req, res) => {
  const channel = await queryOne("SELECT * FROM channels WHERE id = ?", [req.params.channelId]);
  if (!channel) return res.status(404).json({ error: "Channel not found" });
  const project = await userProject(req.user.id, channel.project_id);
  if (!project) return res.status(404).json({ error: "Channel not found" });

  const nodes = await query("SELECT * FROM nodes WHERE channel_id = ?", [channel.id]);
  const nodeIds = nodes.map((n) => n.id);

  await withTransaction(async (tx) => {
    if (nodeIds.length > 0) {
      const placeholders = nodeIds.map(() => "?").join(",");
      await tx.execute(
        `DELETE FROM edges WHERE source_id IN (${placeholders}) OR target_id IN (${placeholders})`,
        [...nodeIds, ...nodeIds],
      );
      for (const node of nodes) {
        await tx.execute("DELETE FROM nodes WHERE id = ?", [node.id]);
      }
    }
    await tx.execute("DELETE FROM channels WHERE id = ?", [channel.id]);
  });

  for (const node of nodes) {
    await clearWeekFocusIfTask(project.id, node.id);
  }

  res.json({ ok: true });
});

router.post("/nodes", async (req, res) => {
  const project = await userProject(req.user.id, req.body?.projectId);
  if (!project) return res.status(404).json({ error: "Project not found" });
  const type = req.body?.type === "idea" ? "idea" : "task";
  const title = String(req.body?.title || "Untitled").trim() || "Untitled";
  const recurrence = req.body?.recurrence;

  if (
    type === "task" &&
    recurrence?.frequency &&
    FREQUENCIES.has(String(recurrence.frequency))
  ) {
    const startDate =
      req.body?.dueAt?.slice(0, 10) || new Date().toISOString().slice(0, 10);
    const endDate = recurrence.endDate?.slice(0, 10);
    if (!endDate) {
      return res.status(400).json({ error: "Repeat until date is required" });
    }
    try {
      const result = await createRecurringTasks({
        projectId: project.id,
        title,
        notes: String(req.body?.notes || ""),
        channelId: req.body?.channelId || null,
        priority: req.body?.priority || "p2",
        estimateHours: req.body?.estimateHours ?? null,
        frequency: recurrence.frequency,
        startDate,
        endDate,
        x: Number(req.body?.x) || 0,
        y: Number(req.body?.y) || 0,
      });
      return res.status(201).json({
        node: result.nodes[0],
        nodes: result.nodes,
        series: result.series,
        count: result.count,
      });
    } catch (err) {
      return res.status(400).json({ error: err.message || "Could not create recurring tasks" });
    }
  }

  const node = {
    id: randomUUID(),
    project_id: project.id,
    type,
    title,
    notes: String(req.body?.notes || ""),
    x: Number(req.body?.x) || 0,
    y: Number(req.body?.y) || 0,
    channel_id: req.body?.channelId || null,
    priority: type === "task" ? req.body?.priority || "p2" : null,
    estimate_hours: req.body?.estimateHours ?? null,
    due_at: req.body?.dueAt || null,
    image_url: req.body?.imageUrl?.trim() || null,
    category: req.body?.category?.trim() || null,
    created_at: nowIso(),
  };
  await execute(
    `INSERT INTO nodes (id, project_id, type, title, notes, x, y, channel_id, priority, estimate_hours, due_at, image_url, category, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      node.id,
      node.project_id,
      node.type,
      node.title,
      node.notes,
      node.x,
      node.y,
      node.channel_id,
      node.priority,
      node.estimate_hours,
      node.due_at,
      node.image_url,
      node.category,
      node.created_at,
    ],
  );
  await onTaskCreated(node);
  res.status(201).json({ node });
});

router.patch("/nodes/:nodeId", async (req, res) => {
  const node = await queryOne("SELECT * FROM nodes WHERE id = ?", [req.params.nodeId]);
  if (!node) return res.status(404).json({ error: "Node not found" });
  const project = await userProject(req.user.id, node.project_id);
  if (!project) return res.status(404).json({ error: "Node not found" });

  const next = { ...node };
  if (req.body?.title != null) next.title = String(req.body.title).trim() || node.title;
  if (req.body?.notes != null) next.notes = String(req.body.notes);
  if (req.body?.x != null) next.x = Number(req.body.x);
  if (req.body?.y != null) next.y = Number(req.body.y);
  if (req.body?.estimateHours !== undefined) next.estimate_hours = req.body.estimateHours;
  if (req.body?.dueAt !== undefined) next.due_at = req.body.dueAt;
  if (req.body?.type && ["idea", "task"].includes(req.body.type)) {
    next.type = req.body.type;
  }
  if (req.body?.promote === "task") {
    next.type = "task";
    next.priority = next.priority || req.body.priority || "p2";
  }
  if (req.body?.priority !== undefined) next.priority = req.body.priority;
  if (req.body?.channelId !== undefined) next.channel_id = req.body.channelId || null;
  if (req.body?.imageUrl !== undefined) next.image_url = req.body.imageUrl?.trim() || null;
  if (req.body?.category !== undefined) next.category = req.body.category?.trim() || null;
  if (next.type === "task" && !next.priority) next.priority = "p2";

  await execute(
    `UPDATE nodes SET title = ?, notes = ?, x = ?, y = ?, type = ?,
      channel_id = ?, priority = ?, estimate_hours = ?, due_at = ?, image_url = ?, category = ?
     WHERE id = ?`,
    [
      next.title,
      next.notes,
      next.x,
      next.y,
      next.type,
      next.channel_id,
      next.priority,
      next.estimate_hours,
      next.due_at,
      next.image_url,
      next.category,
      next.id,
    ],
  );
  await onTaskUpdated(node, next);
  res.json({ node: await queryOne("SELECT * FROM nodes WHERE id = ?", [next.id]) });
});

router.delete("/nodes/:nodeId", async (req, res) => {
  const node = await queryOne("SELECT * FROM nodes WHERE id = ?", [req.params.nodeId]);
  if (!node) return res.status(404).json({ error: "Node not found" });
  const project = await userProject(req.user.id, node.project_id);
  if (!project) return res.status(404).json({ error: "Node not found" });
  await execute("DELETE FROM nodes WHERE id = ?", [node.id]);
  await onTaskDeleted(node);
  await clearWeekFocusIfTask(project.id, node.id);
  res.json({ ok: true });
});

router.get("/recurrence/:seriesId", async (req, res) => {
  const series = await getRecurrenceSeries(req.params.seriesId);
  if (!series) return res.status(404).json({ error: "Series not found" });
  const project = await userProject(req.user.id, series.projectId);
  if (!project) return res.status(404).json({ error: "Series not found" });
  const count = await queryOne(
    "SELECT COUNT(*) AS count FROM nodes WHERE recurrence_series_id = ?",
    [series.id],
  );
  res.json({ series, instanceCount: Number(count?.count) || 0 });
});

router.delete("/recurrence/:seriesId", async (req, res) => {
  const row = await queryOne("SELECT * FROM recurrence_series WHERE id = ?", [req.params.seriesId]);
  if (!row) return res.status(404).json({ error: "Series not found" });
  const project = await userProject(req.user.id, row.project_id);
  if (!project) return res.status(404).json({ error: "Series not found" });
  const result = await deleteRecurrenceSeries(req.params.seriesId, project.id);
  res.json({ ok: true, deleted: result?.deleted ?? 0 });
});

router.post("/edges", async (req, res) => {
  const project = await userProject(req.user.id, req.body?.projectId);
  if (!project) return res.status(404).json({ error: "Project not found" });
  const source = await queryOne("SELECT * FROM nodes WHERE id = ?", [req.body?.sourceId]);
  const target = await queryOne("SELECT * FROM nodes WHERE id = ?", [req.body?.targetId]);
  if (!source || !target || source.project_id !== project.id || target.project_id !== project.id) {
    return res.status(400).json({ error: "Both nodes must belong to the project" });
  }
  const edge = {
    id: randomUUID(),
    project_id: project.id,
    source_id: source.id,
    target_id: target.id,
  };
  await execute("INSERT INTO edges (id, project_id, source_id, target_id) VALUES (?, ?, ?, ?)", [
    edge.id,
    edge.project_id,
    edge.source_id,
    edge.target_id,
  ]);
  res.status(201).json({ edge });
});

router.delete("/edges/:edgeId", async (req, res) => {
  const edge = await queryOne("SELECT * FROM edges WHERE id = ?", [req.params.edgeId]);
  if (!edge) return res.status(404).json({ error: "Edge not found" });
  const project = await userProject(req.user.id, edge.project_id);
  if (!project) return res.status(404).json({ error: "Edge not found" });
  await execute("DELETE FROM edges WHERE id = ?", [edge.id]);
  res.json({ ok: true });
});

router.get("/week", async (req, res) => {
  const project = await queryOne("SELECT * FROM projects WHERE user_id = ?", [req.user.id]);
  if (!project) return res.status(404).json({ error: "No project yet" });

  const weekOffset = Number.parseInt(req.query.offset ?? "0", 10) || 0;
  const neighborLimit = req.query.neighborLimit;
  const neighborOffset = req.query.neighborOffset;

  const raw = await buildWeekViewPaginated(project.id, {
    weekOffset,
    neighborLimit,
    neighborOffset,
  });

  res.json({
    project,
    channels: await listChannels(project.id, { includeArchived: false }),
    ...raw,
  });
});

router.put("/week/focus", async (req, res) => {
  const project = await queryOne("SELECT * FROM projects WHERE user_id = ?", [req.user.id]);
  if (!project) return res.status(404).json({ error: "No project yet" });

  const taskId = req.body?.taskId;
  if (!taskId) return res.status(400).json({ error: "taskId is required" });

  const weekOffset = Number.parseInt(req.query.offset ?? "0", 10) || 0;
  const startIso = weekStartIso(weekOffset);

  const task = await queryOne(
    "SELECT * FROM nodes WHERE id = ? AND project_id = ? AND type = 'task'",
    [taskId, project.id],
  );
  if (!task) return res.status(404).json({ error: "Task not found" });

  await setManualWeekFocus(project.id, taskId, startIso);

  const view = await buildWeekViewPaginated(project.id, { weekOffset });
  res.json({
    project,
    channels: await listChannels(project.id, { includeArchived: false }),
    ...view,
  });
});

router.delete("/week/focus", async (req, res) => {
  const project = await queryOne("SELECT * FROM projects WHERE user_id = ?", [req.user.id]);
  if (!project) return res.status(404).json({ error: "No project yet" });

  const weekOffset = Number.parseInt(req.query.offset ?? "0", 10) || 0;
  await clearManualWeekFocus(project.id);

  const view = await buildWeekViewPaginated(project.id, { weekOffset });
  res.json({
    project,
    channels: await listChannels(project.id, { includeArchived: false }),
    ...view,
  });
});

export default router;
