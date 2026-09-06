import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const DATABASE_URL = process.env.DATABASE_URL || "";
export const isPostgres = /^postgres(ql)?:\/\//i.test(DATABASE_URL);

function toPostgres(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => {
    i += 1;
    return `$${i}`;
  });
}

function namedToPositional(sql, params) {
  if (!params || Array.isArray(params) || typeof params !== "object") {
    return { sql, params: params || [] };
  }
  const values = [];
  const positional = sql.replace(/@(\w+)/g, (_m, key) => {
    values.push(params[key]);
    return "?";
  });
  return { sql: positional, params: values };
}

let sqlite;
let pool;

async function initSqlite() {
  const { DatabaseSync } = await import("node:sqlite");
  const dataDir = path.join(__dirname, "..", "data");
  fs.mkdirSync(dataDir, { recursive: true });
  sqlite = new DatabaseSync(path.join(dataDir, "fovea.db"));
  sqlite.exec("PRAGMA journal_mode = WAL");
  sqlite.exec("PRAGMA foreign_keys = ON");
}

async function initPostgres() {
  const { default: pg } = await import("pg");
  pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.PGSSL === "0" ? false : { rejectUnauthorized: false },
  });
}

export async function initDb() {
  if (isPostgres) await initPostgres();
  else await initSqlite();
  await migrate();
}

export async function query(sql, params) {
  const converted = namedToPositional(sql, params);
  if (isPostgres) {
    const result = await pool.query(toPostgres(converted.sql), converted.params);
    return result.rows;
  }
  return sqlite.prepare(converted.sql).all(...converted.params);
}

export async function queryOne(sql, params) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function execute(sql, params) {
  const converted = namedToPositional(sql, params);
  if (isPostgres) {
    await pool.query(toPostgres(converted.sql), converted.params);
    return;
  }
  sqlite.prepare(converted.sql).run(...converted.params);
}

export async function withTransaction(work) {
  if (isPostgres) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const tx = {
        async execute(sql, params) {
          const converted = namedToPositional(sql, params);
          await client.query(toPostgres(converted.sql), converted.params);
        },
      };
      const result = await work(tx);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  sqlite.exec("BEGIN");
  try {
    const tx = {
      async execute(sql, params) {
        const converted = namedToPositional(sql, params);
        sqlite.prepare(converted.sql).run(...converted.params);
      },
    };
    const result = await work(tx);
    sqlite.exec("COMMIT");
    return result;
  } catch (err) {
    sqlite.exec("ROLLBACK");
    throw err;
  }
}

async function migrate() {
  await execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_sub TEXT UNIQUE NOT NULL,
      email TEXT,
      name TEXT,
      avatar TEXT,
      created_at TEXT NOT NULL,
      last_login_at TEXT
    )
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      x DOUBLE PRECISION NOT NULL DEFAULT 0,
      y DOUBLE PRECISION NOT NULL DEFAULT 0,
      channel_id TEXT REFERENCES channels(id) ON DELETE SET NULL,
      priority TEXT,
      estimate_hours DOUBLE PRECISION,
      due_at TEXT,
      created_at TEXT NOT NULL
    )
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS edges (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      source_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      target_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE
    )
  `);
  await execute(
    "CREATE INDEX IF NOT EXISTS idx_nodes_project_type ON nodes(project_id, type)",
  );
  await execute(
    "CREATE INDEX IF NOT EXISTS idx_nodes_project_channel ON nodes(project_id, channel_id)",
  );
  await execute(
    "CREATE INDEX IF NOT EXISTS idx_nodes_project_type_priority ON nodes(project_id, type, priority, created_at)",
  );
  await execute(
    "CREATE INDEX IF NOT EXISTS idx_channels_project_name ON channels(project_id, name)",
  );
  await execute(
    "CREATE INDEX IF NOT EXISTS idx_nodes_map_order ON nodes(project_id, type, channel_id, priority, created_at)",
  );
  await execute(
    "CREATE INDEX IF NOT EXISTS idx_nodes_project_type_due ON nodes(project_id, type, due_at)",
  );
  await execute(`
    CREATE TABLE IF NOT EXISTS recurrence_series (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      channel_id TEXT REFERENCES channels(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      priority TEXT,
      estimate_hours DOUBLE PRECISION,
      frequency TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      created_at TEXT NOT NULL
    )
  `);
  await execute(
    "CREATE INDEX IF NOT EXISTS idx_recurrence_project ON recurrence_series(project_id)",
  );

  if (isPostgres) {
    await execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TEXT");
    await execute("ALTER TABLE channels ADD COLUMN IF NOT EXISTS task_count INTEGER NOT NULL DEFAULT 0");
    await execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS week_focus_task_id TEXT");
    await execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS week_focus_week_start TEXT");
    await execute("ALTER TABLE nodes ADD COLUMN IF NOT EXISTS image_url TEXT");
    await execute("ALTER TABLE nodes ADD COLUMN IF NOT EXISTS category TEXT");
    await execute("ALTER TABLE nodes ADD COLUMN IF NOT EXISTS recurrence_series_id TEXT");
    await execute("ALTER TABLE nodes ADD COLUMN IF NOT EXISTS occurrence_date TEXT");
  } else {
    const userCols = await query("PRAGMA table_info(users)");
    const userNames = new Set(userCols.map((c) => c.name));
    if (!userNames.has("last_login_at")) {
      await execute("ALTER TABLE users ADD COLUMN last_login_at TEXT");
    }
    const channelCols = await query("PRAGMA table_info(channels)");
    const channelNames = new Set(channelCols.map((c) => c.name));
    if (!channelNames.has("task_count")) {
      await execute("ALTER TABLE channels ADD COLUMN task_count INTEGER NOT NULL DEFAULT 0");
    }
    const projectCols = await query("PRAGMA table_info(projects)");
    const projectNames = new Set(projectCols.map((c) => c.name));
    if (!projectNames.has("week_focus_task_id")) {
      await execute("ALTER TABLE projects ADD COLUMN week_focus_task_id TEXT");
    }
    if (!projectNames.has("week_focus_week_start")) {
      await execute("ALTER TABLE projects ADD COLUMN week_focus_week_start TEXT");
    }
    const cols = await query("PRAGMA table_info(nodes)");
    const names = new Set(cols.map((c) => c.name));
    if (!names.has("image_url")) await execute("ALTER TABLE nodes ADD COLUMN image_url TEXT");
    if (!names.has("category")) await execute("ALTER TABLE nodes ADD COLUMN category TEXT");
    if (!names.has("recurrence_series_id")) {
      await execute("ALTER TABLE nodes ADD COLUMN recurrence_series_id TEXT");
    }
    if (!names.has("occurrence_date")) await execute("ALTER TABLE nodes ADD COLUMN occurrence_date TEXT");
  }

  await execute("UPDATE users SET last_login_at = created_at WHERE last_login_at IS NULL");

  await execute(
    "CREATE INDEX IF NOT EXISTS idx_nodes_recurrence ON nodes(recurrence_series_id)",
  );

  const { backfillAllChannelTaskCounts } = await import("./taskCounts.js");
  await backfillAllChannelTaskCounts();
}

export function nowIso() {
  return new Date().toISOString();
}

export function slugify(name) {
  return (
    String(name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "channel"
  );
}
