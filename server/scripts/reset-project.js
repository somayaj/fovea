import { randomUUID } from "node:crypto";
import { initDb, execute, queryOne, nowIso, slugify } from "../src/db.js";

await initDb();
const project = await queryOne("SELECT * FROM projects LIMIT 1");
if (!project) {
  console.log("No project found.");
  process.exit(0);
}

await execute("DELETE FROM edges WHERE project_id = ?", [project.id]);
await execute("DELETE FROM nodes WHERE project_id = ?", [project.id]);
await execute("DELETE FROM channels WHERE project_id = ?", [project.id]);

const created = nowIso();
const channelRows = [];
for (const name of ["Ship", "Design", "Ops"]) {
  const id = randomUUID();
  await execute(
    "INSERT INTO channels (id, project_id, name, slug, archived, created_at) VALUES (?, ?, ?, ?, 0, ?)",
    [id, project.id, name, slugify(name), created],
  );
  channelRows.push({ id, name });
}

const [ship, design, ops] = channelRows;
const nodes = [
  {
    id: randomUUID(),
    type: "task",
    title: "Ship the weekly focus map",
    notes: "The fovea is the sharpest point of your week — one task that everything else supports.",
    x: 280,
    y: 220,
    channel_id: ship.id,
    priority: "p0",
    estimate_hours: 8,
  },
  {
    id: randomUUID(),
    type: "task",
    title: "Stand up your workstreams",
    notes: "Ship, Design, and Ops — lanes for the work, not another chat room.",
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
    notes: "Let ideas live lightly. Promote them only when they become real work.",
    x: 520,
    y: 60,
    channel_id: design.id,
    priority: "p1",
    estimate_hours: 4,
  },
  {
    id: randomUUID(),
    type: "idea",
    title: "Invite a teammate",
    notes: "Collaboration is a later chapter. For now, enjoy the calm of a single mind.",
    x: 80,
    y: 360,
    channel_id: ops.id,
    priority: null,
    estimate_hours: null,
  },
  {
    id: randomUUID(),
    type: "task",
    title: "v1: map, focus, and workstreams",
    notes: "The smallest slice that still feels like Fovea.",
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
      project.id,
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
  project.id,
  nodes[1].id,
  nodes[0].id,
]);
await execute("INSERT INTO edges (id, project_id, source_id, target_id) VALUES (?, ?, ?, ?)", [
  randomUUID(),
  project.id,
  nodes[2].id,
  nodes[0].id,
]);
await execute("INSERT INTO edges (id, project_id, source_id, target_id) VALUES (?, ?, ?, ?)", [
  randomUUID(),
  project.id,
  nodes[0].id,
  nodes[4].id,
]);
await execute("INSERT INTO edges (id, project_id, source_id, target_id) VALUES (?, ?, ?, ?)", [
  randomUUID(),
  project.id,
  nodes[3].id,
  nodes[1].id,
]);

const counts = {
  tasks: (await queryOne("SELECT COUNT(*) AS c FROM nodes WHERE project_id = ? AND type = ?", [project.id, "task"]))?.c,
  ideas: (await queryOne("SELECT COUNT(*) AS c FROM nodes WHERE project_id = ? AND type = ?", [project.id, "idea"]))?.c,
  channels: (await queryOne("SELECT COUNT(*) AS c FROM channels WHERE project_id = ?", [project.id]))?.c,
  edges: (await queryOne("SELECT COUNT(*) AS c FROM edges WHERE project_id = ?", [project.id]))?.c,
};

console.log(`Reset "${project.name}" to starter data:`, counts);
