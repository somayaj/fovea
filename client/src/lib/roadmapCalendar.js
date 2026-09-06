/** Day grid helpers for the roadmap calendar view. */

export function dayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function monthKeyFromParts(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function calendarMonthFromOffset(offset = 0) {
  const date = new Date();
  date.setDate(1);
  date.setHours(12, 0, 0, 0);
  date.setMonth(date.getMonth() + offset);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    monthKey: monthKeyFromParts(date.getFullYear(), date.getMonth() + 1),
    label: date.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
  };
}

export function isToday(date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function buildCalendarCells(year, month) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];

  for (let pad = 0; pad < firstOfMonth.getDay(); pad += 1) {
    const date = new Date(year, month - 1, 1 - (firstOfMonth.getDay() - pad));
    cells.push({ date, inMonth: false, key: dayKey(date) });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day);
    cells.push({ date, inMonth: true, key: dayKey(date) });
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const date = new Date(last);
    date.setDate(date.getDate() + 1);
    cells.push({ date, inMonth: false, key: dayKey(date) });
  }

  return cells;
}

export function groupTasksByDay(tasks) {
  const byDay = {};
  for (const task of tasks) {
    if (!task?.due_at) continue;
    const date = new Date(task.due_at);
    if (Number.isNaN(date.getTime())) continue;
    const key = dayKey(date);
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(task);
  }
  for (const key of Object.keys(byDay)) {
    byDay[key].sort((a, b) => {
      const dueA = new Date(a.due_at).getTime();
      const dueB = new Date(b.due_at).getTime();
      if (dueA !== dueB) return dueA - dueB;
      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  }
  return byDay;
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function heatLevel(count = 0) {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 8) return 2;
  if (count <= 24) return 3;
  return 4;
}

/** Compact count for calendar cells — full number up to 9,999, then k/M. */
export function formatDayCount(count = 0) {
  if (count <= 0) return "";
  if (count < 10_000) return count.toLocaleString();
  if (count < 1_000_000) {
    const value = count / 1000;
    return `${value >= 100 ? Math.round(value) : value.toFixed(1).replace(/\.0$/, "")}k`;
  }
  const value = count / 1_000_000;
  return `${value >= 10 ? Math.round(value) : value.toFixed(1).replace(/\.0$/, "")}M`;
}

export function formatDayLabel(dayKey) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function emptyCalendarMonth(monthKey) {
  return {
    monthKey,
    monthTotal: 0,
    previewPerDay: 3,
    days: {},
  };
}

export function emptyCalendarYear(year) {
  return {
    year,
    yearTotal: 0,
    unscheduledTotal: 0,
    monthTotals: {},
    days: {},
  };
}

export function monthOffsetForKey(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const now = new Date();
  return (year - now.getFullYear()) * 12 + (month - 1 - now.getMonth());
}
