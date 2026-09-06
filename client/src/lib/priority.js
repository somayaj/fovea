import { cn } from "./tw.js";

export const PRIORITY_LEVELS = [
  { value: "p0", code: "P0", label: "Critical" },
  { value: "p1", code: "P1", label: "High" },
  { value: "p2", code: "P2", label: "Normal" },
  { value: "p3", code: "P3", label: "Low" },
];

export const PRIORITY_ORDER = { p0: 0, p1: 1, p2: 2, p3: 3 };

export function priorityMeta(priority = "p2") {
  return PRIORITY_LEVELS.find((p) => p.value === priority) || PRIORITY_LEVELS[2];
}

export function priorityLabel(priority = "p2") {
  return priorityMeta(priority).label;
}

export function priorityBadgeClass(priority = "p2", { map = false } = {}) {
  const level = priorityMeta(priority).value;
  return cn(
    "priority-badge",
    `priority-badge-${level}`,
    map && "priority-badge-map",
  );
}

export function prioritySelectClass(priority = "p2") {
  return `priority-select priority-select-${priorityMeta(priority).value}`;
}
