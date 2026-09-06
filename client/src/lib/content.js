const WORKSTREAM_THEMES = {
  ship: {
    gradient: "from-stone-800 via-stone-700 to-stone-600",
    accent: "#c45f3e",
    tagline: "What you're building",
  },
  design: {
    gradient: "from-stone-600 via-stone-500 to-stone-400",
    accent: "#b85a42",
    tagline: "How it should feel",
  },
  ops: {
    gradient: "from-stone-500 via-stone-400 to-stone-300",
    accent: "#c47a2f",
    tagline: "What keeps it running",
  },
};

const PRIORITY_COPY = {
  p0: "Critical this week",
  p1: "High this week",
  p2: "On the list",
  p3: "When there's room",
};

const TYPE_COPY = {
  task: "Task",
  idea: "Idea",
};

export function workstreamTheme(name) {
  const key = String(name || "").toLowerCase();
  return (
    WORKSTREAM_THEMES[key] || {
      gradient: "from-stone-200 via-stone-100 to-stone-50",
      accent: "#a8a29e",
      tagline: "Workstream",
    }
  );
}

export function workstreamMonogram(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "·";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
}

export function priorityLabel(priority) {
  return PRIORITY_COPY[priority] || PRIORITY_COPY.p2;
}

export function typeLabel(type) {
  if (type === "milestone") return TYPE_COPY.task;
  return TYPE_COPY[type] || type;
}

export function formatFocusReason(reason, fallback = false) {
  if (!reason) return "This looks like a good place to start — we'll keep the rest nearby so nothing gets lost.";
  if (fallback) {
    return reason
      .replace(/^Nothing is marked for this week\./, "Nothing is due this week yet — ")
      .replace(/^Nothing critical is queued this week — Fovea chose/, "Nothing urgent this week, so we picked");
  }
  return reason
    .replace("lowest priority number, then nearest due date", "it's the most urgent, with the nearest due date")
    .replace("highest urgency, then nearest due date", "it's the most urgent, with the nearest due date")
    .replace("P0 in", "It's urgent in")
    .replace("p0/p1", "urgent or high priority")
    .replace("next-best task", "next good thing to work on")
    .replace("Fovea chose", "We picked");
}
