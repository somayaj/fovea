export const REPEAT_OPTIONS = [
  { value: "", label: "Does not repeat" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
];

export function defaultRepeatUntil(fromDate = new Date()) {
  const d = new Date(fromDate);
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

export function formatRepeatUntil(iso) {
  if (!iso) return "";
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
