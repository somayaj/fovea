import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execute, initDb, query, queryOne, slugify } from "../src/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PRIORITIES = ["p0", "p1", "p2", "p2", "p2", "p3", "p3", "p3"];
const CHANNEL_COUNT = 80;
const BATCH_SIZE = 200;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    count: 100_000,
    replace: false,
    projectId: null,
  };
  for (const arg of args) {
    if (arg === "--replace") opts.replace = true;
    else if (arg.startsWith("--count=")) opts.count = Number(arg.split("=")[1]) || 100_000;
    else if (arg.startsWith("--project=")) opts.projectId = arg.split("=")[1];
  }
  return opts;
}

async function ensureChannels(projectId, createdAt) {
  const existing = await query("SELECT id, name FROM channels WHERE project_id = ? ORDER BY name", [
    projectId,
  ]);
  if (existing.length >= CHANNEL_COUNT) return existing;

  const channels = [...existing];
  for (let i = existing.length; i < CHANNEL_COUNT; i += 1) {
    const name = `workstream-${String(i + 1).padStart(2, "0")}`;
    const id = randomUUID();
    await execute(
      "INSERT INTO channels (id, project_id, name, slug, archived, created_at) VALUES (?, ?, ?, ?, 0, ?)",
      [id, projectId, name, slugify(name), createdAt],
    );
    channels.push({ id, name });
  }
  return channels;
}

async function clearProjectTasks(projectId) {
  await execute("DELETE FROM edges WHERE project_id = ?", [projectId]);
  await execute("DELETE FROM nodes WHERE project_id = ?", [projectId]);
}

async function insertBatch(projectId, rows) {
  const placeholders = rows.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
  const values = rows.flat();
  await execute(
    `INSERT INTO nodes (id, project_id, type, title, notes, x, y, channel_id, priority, estimate_hours, due_at, created_at)
     VALUES ${placeholders}`,
    values,
  );
}

async function seedTasks(projectId, channels, count, createdAt) {
  const hubId = randomUUID();
  await execute(
    `INSERT INTO nodes (id, project_id, type, title, notes, x, y, channel_id, priority, estimate_hours, due_at, created_at)
     VALUES (?, ?, 'task', ?, '', 500, 90, ?, 'p0', NULL, NULL, ?)`,
    [hubId, projectId, "Weekly focus — ship the release", channels[0]?.id || null, createdAt],
  );

  let inserted = 0;
  let batch = [];

  while (inserted < count) {
    const id = randomUUID();
    const channel = channels[inserted % channels.length];
    const priority = PRIORITIES[inserted % PRIORITIES.length];
    const n = inserted + 1;

    batch.push([
      id,
      projectId,
      "task",
      `Task ${n.toLocaleString()}`,
      "",
      0,
      0,
      channel.id,
      priority,
      null,
      null,
      createdAt,
    ]);

    inserted += 1;

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(projectId, batch);
      batch = [];
      if (inserted % 10_000 === 0) {
        console.log(`  … ${inserted.toLocaleString()} / ${count.toLocaleString()}`);
      }
    }
  }

  if (batch.length) await insertBatch(projectId, batch);
  return inserted;
}

async function main() {
  const opts = parseArgs();
  await initDb();

  const project =
    (opts.projectId
      ? await queryOne("SELECT * FROM projects WHERE id = ?", [opts.projectId])
      : null) || (await queryOne("SELECT * FROM projects ORDER BY created_at LIMIT 1"));

  if (!project) {
    console.error("No project found. Log in via dev login first to create a starter project.");
    process.exit(1);
  }

  const createdAt = new Date().toISOString();
  console.log(`Project: ${project.name} (${project.id})`);

  if (opts.replace) {
    console.log("Clearing existing nodes and edges…");
    await clearProjectTasks(project.id);
  }

  console.log(`Ensuring ${CHANNEL_COUNT} channels…`);
  const channels = await ensureChannels(project.id, createdAt);

  console.log(`Seeding ${opts.count.toLocaleString()} tasks across ${channels.length} channels…`);
  const started = Date.now();
  await seedTasks(project.id, channels, opts.count, createdAt);
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  const total = await queryOne(
    "SELECT COUNT(*) AS count FROM nodes WHERE project_id = ? AND type = 'task'",
    [project.id],
  );

  console.log(`Done in ${elapsed}s — ${Number(total.count).toLocaleString()} tasks in database.`);
  console.log("Open /map to see rollups (hub + 6 channels per page, 4 tasks per channel).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
