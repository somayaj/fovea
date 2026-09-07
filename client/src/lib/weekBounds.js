/** Monday 00:00 – next Monday 00:00 for the week containing `date`. */
export function weekBounds(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(d.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

/** Week offset (0 = this week) for the Monday week containing `dueAt`. */
export function weekOffsetForDueAt(dueAt) {
  if (!dueAt) return 0;
  const raw = String(dueAt);
  const date = new Date(raw.length === 10 ? `${raw}T12:00:00` : raw);
  if (Number.isNaN(date.getTime())) return 0;

  const taskWeekStart = weekBounds(date).start;
  const currentWeekStart = weekBounds().start;
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.round((taskWeekStart.getTime() - currentWeekStart.getTime()) / msPerWeek);
}

/** ISO bounds for the week at `offset` from the current week (0 = this week). */
export function datesForWeekOffset(offset = 0) {
  const { start } = weekBounds();
  const anchor = new Date(start);
  anchor.setDate(anchor.getDate() + offset * 7);
  const bounds = weekBounds(anchor);
  return {
    weekStart: bounds.start.toISOString(),
    weekEnd: bounds.end.toISOString(),
  };
}
