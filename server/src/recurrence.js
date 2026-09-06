import { randomUUID } from "node:crypto";
import { execute, nowIso, query, queryOne, withTransaction } from "./db.js";
import { onTaskCreated } from "./taskCounts.js";

export const FREQUENCIES = new Set(["weekly", "biweekly", "monthly"]);
export const MAX_OCCURRENCES = 52;

const FREQUENCY_LABEL = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

export function frequencyLabel(frequency) {
  return FREQUENCY_LABEL[frequency] || frequency;
}

function parseYmd(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date) {
  const next = new Date(date);
  const day = next.getDate();
  next.setMonth(next.getMonth() + 1);
  if (next.getDate() !== day) next.setDate(0);
  return next;
}

/** Build due dates for a recurring series within a period. */
export function buildOccurrenceDates({ frequency, startDate, endDate }) {
  if (!FREQUENCIES.has(frequency)) return [];
  const start = parseYmd(startDate);
  const end = endDate ? parseYmd(endDate) : addMonths(start, 6);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

  const dates = [];
  let current = start;
  while (dates.length < MAX_OCCURRENCES) {
    if (current > end) break;
    dates.push(formatYmd(current));
    if (frequency === "weekly") current = addDays(current, 7);
    else if (frequency === "biweekly") current = addDays(current, 14);
    else if (frequency === "monthly") current = addMonths(current);
    else break;
  }
  return dates;
}

export async function getRecurrenceSeries(seriesId) {
  if (!seriesId) return null;
  const row = await queryOne("SELECT * FROM recurrence_series WHERE id = ?", [seriesId]);
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    channelId: row.channel_id,
    title: row.title,
    frequency: row.frequency,
    startDate: row.start_date,
    endDate: row.end_date,
    label: frequencyLabel(row.frequency),
  };
}

export async function createRecurringTasks({
  projectId,
  title,
  notes = "",
  channelId = null,
  priority = "p2",
  estimateHours = null,
  frequency,
  startDate,
  endDate,
  x = 0,
  y = 0,
}) {
  const dates = buildOccurrenceDates({ frequency, startDate, endDate });
  if (dates.length === 0) {
    throw new Error("No occurrences in that period — check dates and repeat setting.");
  }

  const seriesId = randomUUID();
  const createdAt = nowIso();
  const nodes = [];

  await withTransaction(async (tx) => {
    await tx.execute(
      `INSERT INTO recurrence_series
        (id, project_id, channel_id, title, notes, priority, estimate_hours, frequency, start_date, end_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        seriesId,
        projectId,
        channelId,
        title,
        notes,
        priority,
        estimateHours,
        frequency,
        startDate,
        endDate || null,
        createdAt,
      ],
    );

    for (const dueAt of dates) {
      const node = {
        id: randomUUID(),
        project_id: projectId,
        type: "task",
        title,
        notes,
        x,
        y,
        channel_id: channelId,
        priority,
        estimate_hours: estimateHours,
        due_at: `${dueAt}T12:00:00.000Z`,
        recurrence_series_id: seriesId,
        occurrence_date: dueAt,
        image_url: null,
        category: null,
        created_at: createdAt,
      };
      await tx.execute(
        `INSERT INTO nodes
          (id, project_id, type, title, notes, x, y, channel_id, priority, estimate_hours, due_at,
           image_url, category, recurrence_series_id, occurrence_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          node.recurrence_series_id,
          node.occurrence_date,
          node.created_at,
        ],
      );
      nodes.push(node);
    }
  });

  for (const node of nodes) {
    await onTaskCreated(node);
  }

  const series = await getRecurrenceSeries(seriesId);
  return { series, nodes, count: nodes.length };
}

export async function deleteRecurrenceSeries(seriesId, projectId) {
  const series = await queryOne(
    "SELECT * FROM recurrence_series WHERE id = ? AND project_id = ?",
    [seriesId, projectId],
  );
  if (!series) return null;

  const instances = await query("SELECT * FROM nodes WHERE recurrence_series_id = ?", [seriesId]);

  await withTransaction(async (tx) => {
    for (const node of instances) {
      await tx.execute("DELETE FROM edges WHERE source_id = ? OR target_id = ?", [node.id, node.id]);
      await tx.execute("DELETE FROM nodes WHERE id = ?", [node.id]);
    }
    await tx.execute("DELETE FROM recurrence_series WHERE id = ?", [seriesId]);
  });

  const { onTaskDeleted } = await import("./taskCounts.js");
  const { clearWeekFocusIfTask } = await import("./weekFocus.js");
  for (const node of instances) {
    if (node.type === "task") await onTaskDeleted(node);
    await clearWeekFocusIfTask(projectId, node.id);
  }

  return { deleted: instances.length };
}
