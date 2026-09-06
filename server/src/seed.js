import { randomUUID } from "node:crypto";
import { execute, nowIso, queryOne, slugify } from "./db.js";

export async function ensureStarterProject(userId) {
  const existing = await queryOne("SELECT * FROM projects WHERE user_id = ?", [userId]);
  if (existing) return existing;

  const projectId = randomUUID();
  const created = nowIso();
  await execute("INSERT INTO projects (id, user_id, name, created_at) VALUES (?, ?, ?, ?)", [
    projectId,
    userId,
    "Personal",
    created,
  ]);

  const channelRows = [];
  for (const name of ["ship", "design", "ops"]) {
    const id = randomUUID();
    await execute(
      "INSERT INTO channels (id, project_id, name, slug, archived, created_at) VALUES (?, ?, ?, ?, 0, ?)",
      [id, projectId, name, slugify(name), created],
    );
    channelRows.push({ id, name });
  }

  const [ship, design, ops] = channelRows;
  const nodes = [
    {
      id: randomUUID(),
      type: "task",
      title: "Ship the weekly focus map",
      notes: "This is the fovea — the sharpest point of the week.",
      x: 280,
      y: 220,
      channel_id: ship.id,
      priority: "p0",
      estimate_hours: 8,
    },
    {
      id: randomUUID(),
      type: "task",
      title: "Create the first channels",
      notes: "Workstreams, not chat rooms.",
      x: 40,
      y: 80,
      channel_id: ops.id,
      priority: "p1",
      estimate_hours: 2,
    },
    {
      id: randomUUID(),
      type: "task",
      title: "Sketch the idea map",
      notes: "Promote ideas only when they are real work.",
      x: 520,
      y: 60,
      channel_id: design.id,
      priority: "p1",
      estimate_hours: 4,
    },
    {
      id: randomUUID(),
      type: "idea",
      title: "Invite a teammate later",
      notes: "Out of scope for v1.",
      x: 80,
      y: 360,
      channel_id: ops.id,
      priority: null,
      estimate_hours: null,
    },
    {
      id: randomUUID(),
      type: "task",
      title: "v1 slice",
      notes: "Map + channels + this week.",
      x: 500,
      y: 340,
      channel_id: ship.id,
      priority: "p1",
      estimate_hours: 20,
    },
  ];

  for (const node of nodes) {
    await execute(
      `INSERT INTO nodes (id, project_id, type, title, notes, x, y, channel_id, priority, estimate_hours, due_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
      [
        node.id,
        projectId,
        node.type,
        node.title,
        node.notes,
        node.x,
        node.y,
        node.channel_id,
        node.priority,
        node.estimate_hours,
        created,
      ],
    );
  }

  await execute("INSERT INTO edges (id, project_id, source_id, target_id) VALUES (?, ?, ?, ?)", [
    randomUUID(),
    projectId,
    nodes[1].id,
    nodes[0].id,
  ]);
  await execute("INSERT INTO edges (id, project_id, source_id, target_id) VALUES (?, ?, ?, ?)", [
    randomUUID(),
    projectId,
    nodes[2].id,
    nodes[0].id,
  ]);
  await execute("INSERT INTO edges (id, project_id, source_id, target_id) VALUES (?, ?, ?, ?)", [
    randomUUID(),
    projectId,
    nodes[0].id,
    nodes[4].id,
  ]);
  await execute("INSERT INTO edges (id, project_id, source_id, target_id) VALUES (?, ?, ?, ?)", [
    randomUUID(),
    projectId,
    nodes[3].id,
    nodes[1].id,
  ]);

  return queryOne("SELECT * FROM projects WHERE id = ?", [projectId]);
}
