import { randomUUID } from "node:crypto";
import { Router } from "express";
import { execute, nowIso, query, queryOne, slugify, withTransaction } from "./db.js";
import { requireAuth } from "./auth.js";
import { isAdminUser, requireAdmin, revealUser, summarizeUser } from "./admin.js";
import { normalizeThemeId } from "./themes.js";
import {
  buildMapView,
  isUnsortedChannelFilter,
  MAP_CHANNEL_TASK_PAGE_SIZE,
  MAP_TASK_COLUMNS,
  taskPageForRank,
  taskRankInChannel,
} from "./mapView.js";
import { channelNameMap, getChannel, listChannelsPaginated } from "./channels.js";
import {
  archiveChannelWithTasks,
  deleteChannelWithTasks,
  restoreChannelWithTasks,
} from "./channelArchive.js";
import { buildWeekViewPaginated } from "./weekView.js";
import {
  buildRoadmapBucket,
  buildRoadmapYear,
  buildRoadmapCalendarDay,
  buildRoadmapCalendarMonth,
  buildRoadmapCalendarYear,
  buildRoadmapTimeline,
} from "./roadmapView.js";
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
import { ACTIVE_TASK_AND, ACTIVE_NODE_AND } from "./taskFilters.js";

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
      themeId: req.user.theme_id || null,
    },
    project,
  });
});

router.patch("/me/theme", async (req, res) => {
  const themeId = normalizeThemeId(req.body?.themeId);
  if (!themeId) return res.status(400).json({ error: "Invalid theme" });
  await execute("UPDATE users SET theme_id = ? WHERE id = ?", [themeId, req.user.id]);
  res.json({ themeId });
});

router.get("/admin/users", requireAdmin, async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const totalRow = await queryOne("SELECT COUNT(*) AS count FROM users");
  const totalUsers = Number(totalRow?.count) || 0;

  const users = await query(
    "SELECT id, email, name, avatar, google_sub, created_at, last_login_at, theme_id FROM users ORDER BY COALESCE(last_login_at, created_at) DESC LIMIT ? OFFSET ?",
    [limit, offset],
  );

  const taskCounts = await query(
    `SELECT p.user_id, COUNT(n.id) AS task_count
     FROM projects p
     LEFT JOIN nodes n ON n.project_id = p.id AND n.type = 'task'
     GROUP BY p.user_id`,
  );
  const countByUser = new Map(
    taskCounts.map((row) => [row.user_id, Number(row.task_count) || 0]),
  );
  const totalTasks = taskCounts.reduce((sum, row) => sum + (Number(row.task_count) || 0), 0);

  res.json({
    count: totalUsers,
    totalTasks,
    limit,
    offset,
    hasMore: offset + users.length < totalUsers,
    users: users.map((user) => ({
      ...summarizeUser(user),
      taskCount: countByUser.get(user.id) || 0,
      themeId: user.theme_id || null,
    })),
  });
});

router.get("/admin/users/:id", requireAdmin, async (req, res) => {
  const user = await queryOne(
    "SELECT id, email, name, avatar, google_sub, created_at, last_login_at, theme_id FROM users WHERE id = ?",
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
     FROM nodes WHERE project_id = ? AND type = 'idea' ${ACTIVE_NODE_AND} ORDER BY created_at`,
    [project.id],
  );
  const edges = await query(
    `SELECT e.id, e.project_id, e.source_id, e.target_id
     FROM edges e
     JOIN nodes s ON s.id = e.source_id AND s.type = 'idea' AND (s.archived IS NULL OR s.archived = 0)
     JOIN nodes t ON t.id = e.target_id AND t.type = 'idea' AND (t.archived IS NULL OR t.archived = 0)
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
     WHERE project_id = ? AND type = 'task' ${ACTIVE_TASK_AND} ${channelSql}
     ORDER BY CASE priority WHEN 'p0' THEN 0 WHEN 'p1' THEN 1 WHEN 'p2' THEN 2 WHEN 'p3' THEN 3 ELSE 9 END, created_at
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const total = await queryOne(
    `SELECT COUNT(*) AS count FROM nodes WHERE project_id = ? AND type = 'task' ${ACTIVE_TASK_AND} ${channelSql}`,
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
    `SELECT id, project_id, type, title, notes, x, y, channel_id, priority, estimate_hours, due_at, image_url, category, created_at, completed_at
     FROM nodes
     WHERE project_id = ? AND type = 'task' ${ACTIVE_TASK_AND}
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
  const archivedOnly = req.query.archived === "1";
  const result = await listChannelsPaginated(project.id, { q, limit, offset, archivedOnly });
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

  if (req.body?.archived != null) {
    const wantArchived = Boolean(req.body.archived);
    if (wantArchived && !channel.archived) {
      await archiveChannelWithTasks(project.id, channel.id);
    } else if (!wantArchived && channel.archived) {
      await restoreChannelWithTasks(project.id, channel.id);
    }
    const full = await getChannel(project.id, channel.id);
    return res.json({ channel: full });
  }

  const name = req.body?.name != null ? String(req.body.name).trim() : channel.name;
  if (!name) return res.status(400).json({ error: "Channel name is required" });
  await execute("UPDATE channels SET name = ?, slug = ? WHERE id = ?", [
    name,
    slugify(name),
    channel.id,
  ]);
  res.json({ channel: await getChannel(project.id, channel.id) });
});

router.delete("/channels/:channelId", async (req, res) => {
  const channel = await queryOne("SELECT * FROM channels WHERE id = ?", [req.params.channelId]);
  if (!channel) return res.status(404).json({ error: "Channel not found" });
  const project = await userProject(req.user.id, channel.project_id);
  if (!project) return res.status(404).json({ error: "Channel not found" });

  await deleteChannelWithTasks(project.id, channel.id);
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
  const node = await queryOne(
    `SELECT n.* FROM nodes n
     JOIN projects p ON p.id = n.project_id AND p.user_id = ?
     WHERE n.id = ?`,
    [req.user.id, req.params.nodeId],
  );
  if (!node) return res.status(404).json({ error: "Node not found" });

  const next = { ...node };
  const sets = [];
  const values = [];
  const setCol = (column, value) => {
    if (Object.is(next[column], value)) return;
    next[column] = value;
    sets.push(`${column} = ?`);
    values.push(value);
  };

  if (req.body?.title != null) setCol("title", String(req.body.title).trim() || node.title);
  if (req.body?.notes != null) setCol("notes", String(req.body.notes));
  if (req.body?.x != null) setCol("x", Number(req.body.x));
  if (req.body?.y != null) setCol("y", Number(req.body.y));
  if (req.body?.estimateHours !== undefined) setCol("estimate_hours", req.body.estimateHours);
  if (req.body?.dueAt !== undefined) setCol("due_at", req.body.dueAt);
  if (req.body?.type && ["idea", "task"].includes(req.body.type)) {
    setCol("type", req.body.type);
  }
  if (req.body?.promote === "task") {
    setCol("type", "task");
    if (!next.priority) setCol("priority", req.body.priority || "p2");
  }
  if (req.body?.priority !== undefined) setCol("priority", req.body.priority);
  if (req.body?.channelId !== undefined) setCol("channel_id", req.body.channelId || null);
  if (req.body?.imageUrl !== undefined) setCol("image_url", req.body.imageUrl?.trim() || null);
  if (req.body?.category !== undefined) setCol("category", req.body.category?.trim() || null);
  if (req.body?.completed !== undefined) {
    setCol("completed_at", req.body.completed ? nowIso() : null);
  }
  if (next.type === "task" && !next.priority) setCol("priority", "p2");

  if (sets.length) {
    values.push(next.id);
    await execute(`UPDATE nodes SET ${sets.join(", ")} WHERE id = ?`, values);
    await onTaskUpdated(node, next);
    if (next.completed_at && !node.completed_at) {
      await clearWeekFocusIfTask(node.project_id, next.id);
    }
  }
  res.json({ node: next });
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
  const completedLimit = req.query.completedLimit;
  const completedOffset = req.query.completedOffset;

  const raw = await buildWeekViewPaginated(project.id, {
    weekOffset,
    neighborLimit,
    neighborOffset,
    completedLimit,
    completedOffset,
  });

  res.json({
    project,
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
    `SELECT * FROM nodes WHERE id = ? AND project_id = ? AND type = 'task' ${ACTIVE_TASK_AND}`,
    [taskId, project.id],
  );
  if (!task) return res.status(404).json({ error: "Task not found" });

  await setManualWeekFocus(project.id, taskId, startIso);

  const view = await buildWeekViewPaginated(project.id, { weekOffset });
  res.json({
    project,
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
    ...view,
  });
});

router.get("/roadmap", async (req, res) => {
  const project = await queryOne("SELECT * FROM projects WHERE user_id = ?", [req.user.id]);
  if (!project) return res.status(404).json({ error: "No project yet" });

  const year = Number.parseInt(req.query.year ?? String(new Date().getFullYear()), 10);
  const month = req.query.month || req.query.bucket || null;
  const limit = req.query.limit;
  const offset = req.query.offset;

  if (month) {
    const bucket = await buildRoadmapBucket(project.id, {
      bucket: month,
      year,
      limit,
      offset,
    });
    return res.json({ year, bucket });
  }

  const view = await buildRoadmapYear(project.id, year, { limit });
  res.json({
    project,
    channels: await listChannels(project.id, { includeArchived: false }),
    ...view,
  });
});

router.get("/roadmap/calendar", async (req, res) => {
  const project = await queryOne("SELECT * FROM projects WHERE user_id = ?", [req.user.id]);
  if (!project) return res.status(404).json({ error: "No project yet" });

  const day = req.query.day || null;
  const month = req.query.month || null;
  const yearParam = req.query.year;
  const year =
    yearParam != null && String(yearParam).trim() !== ""
      ? Number.parseInt(String(yearParam), 10)
      : null;
  const limit = req.query.limit;
  const offset = req.query.offset;
  const previewPerDay = req.query.previewPerDay;

  if (day) {
    const bucket = await buildRoadmapCalendarDay(project.id, day, { limit, offset });
    return res.json({ bucket });
  }

  if (month) {
    const view = await buildRoadmapCalendarMonth(project.id, month, { previewPerDay });
    return res.json({ ...view, channels: await listChannels(project.id, { includeArchived: false }) });
  }

  if (Number.isFinite(year)) {
    const view = await buildRoadmapCalendarYear(project.id, year);
    return res.json(view);
  }

  return res.status(400).json({ error: "year, month, or day is required" });
});

router.get("/roadmap/timeline", async (req, res) => {
  const project = await queryOne("SELECT * FROM projects WHERE user_id = ?", [req.user.id]);
  if (!project) return res.status(404).json({ error: "No project yet" });

  const year = Number.parseInt(req.query.year ?? String(new Date().getFullYear()), 10);
  const view = await buildRoadmapTimeline(project.id, year);
  res.json({
    project,
    channels: view.channels,
    ...view,
  });
});

export default router;
