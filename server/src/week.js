const PRIORITY_RANK = { p0: 0, p1: 1, p2: 2, p3: 3 };

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

/** Monday of the week containing today, shifted by `offset` weeks. */
export function dateForWeekOffset(offset = 0) {
  const { start } = weekBounds();
  const d = new Date(start);
  d.setDate(d.getDate() + offset * 7);
  return d;
}

export function isCurrentWeekBounds(bounds) {
  const current = weekBounds();
  return bounds.start.getTime() === current.start.getTime();
}

export function isInWeek(iso, bounds) {
  if (!iso) return false;
  const t = new Date(iso);
  return t >= bounds.start && t < bounds.end;
}

export function isWeekCandidate(node, bounds) {
  if (node.type !== "task") return false;
  return isInWeek(node.due_at, bounds);
}

export function rankTask(node) {
  const pr = PRIORITY_RANK[node.priority] ?? 9;
  const due = node.due_at ? new Date(node.due_at).getTime() : Number.MAX_SAFE_INTEGER;
  const hours = node.estimate_hours ?? 99;
  return [pr, due, hours];
}

export function compareTasks(a, b) {
  const ra = rankTask(a);
  const rb = rankTask(b);
  for (let i = 0; i < ra.length; i += 1) {
    if (ra[i] !== rb[i]) return ra[i] - rb[i];
  }
  return a.title.localeCompare(b.title);
}

export function buildWeekView({ nodes, edges, channels, date = new Date(), weekOffset = 0 }) {
  const bounds = weekBounds(date);
  const isCurrentWeek = isCurrentWeekBounds(bounds);
  const tasks = nodes.filter((n) => n.type === "task");
  const weekTasks = tasks.filter((n) => isWeekCandidate(n, bounds));
  const pool = weekTasks.length > 0 ? weekTasks : [];
  const focus = pool.sort(compareTasks)[0] || null;

  if (!focus) {
    return {
      weekStart: bounds.start.toISOString(),
      weekEnd: bounds.end.toISOString(),
      weekOffset,
      isCurrentWeek,
      focus: null,
      neighbors: [],
      nodes: [],
      edges: [],
      fallback: false,
      reason: "Your map is quiet. Add a task or promote an idea when you're ready.",
    };
  }

  const usedFallback = !weekTasks.length || !["p0", "p1"].includes(focus.priority);
  const neighborIds = new Set();

  for (const edge of edges) {
    if (edge.source_id === focus.id) neighborIds.add(edge.target_id);
    if (edge.target_id === focus.id) neighborIds.add(edge.source_id);
  }

  for (const node of nodes) {
    if (node.id === focus.id) continue;
    const inWeek = isWeekCandidate(node, bounds);
    if (inWeek) neighborIds.add(node.id);
  }

  const neighbors = nodes.filter((n) => neighborIds.has(n.id));
  const visibleIds = new Set([focus.id, ...neighborIds]);
  const visibleNodes = nodes.filter((n) => visibleIds.has(n.id));
  const visibleEdges = edges.filter(
    (e) => visibleIds.has(e.source_id) && visibleIds.has(e.target_id),
  );

  const channelName = channels.find((c) => c.id === focus.channel_id)?.name;
  let reason;
  if (usedFallback) {
    if (!isCurrentWeek) {
      reason = `Top task due this week (${focus.priority?.toUpperCase() || "unranked"}).`;
    } else {
      reason = weekTasks.length
        ? `Nothing critical is queued this week — Fovea chose the next best task (${focus.priority?.toUpperCase() || "unranked"}).`
        : "Nothing is due this week yet. Showing your highest-priority task.";
    }
  } else {
    reason = channelName
      ? `${focus.priority?.toUpperCase()} in #${channelName} — highest urgency, then nearest due date.`
      : `${focus.priority?.toUpperCase()} — highest urgency, then nearest due date.`;
  }

  return {
    weekStart: bounds.start.toISOString(),
    weekEnd: bounds.end.toISOString(),
    weekOffset,
    isCurrentWeek,
    focus,
    neighbors,
    nodes: visibleNodes,
    edges: visibleEdges,
    fallback: usedFallback,
    reason,
  };
}

const BRANCH_COLORS = [
  "#c45f3e",
  "#d4836a",
  "#b85a42",
  "#c47a2f",
  "#8b5a6b",
  "#a84832",
  "#e8a088",
  "#c4a99a",
];

export function radialLayout(focusId, nodes) {
  const cx = 480;
  const cy = 360;
  const others = nodes
    .filter((n) => n.id !== focusId)
    .sort((a, b) => compareTasks(a, b));

  const count = others.length;
  const spread = count <= 1 ? 0.4 : Math.min(Math.PI * 1.75, count * 0.42);
  const startAngle = -Math.PI / 2 - spread / 2;

  return nodes.map((node) => {
    if (node.id === focusId) {
      return { ...node, x: cx, y: cy, branchIndex: -1 };
    }

    const i = others.findIndex((n) => n.id === node.id);
    const angle =
      count === 1
        ? -Math.PI / 2
        : startAngle + (spread * i) / Math.max(count - 1, 1);
    const tier = i % 3;
    const radius = tier === 0 ? 190 : tier === 1 ? 235 : 275;
    const wobble = ((i % 5) - 2) * 6;

    return {
      ...node,
      x: cx + Math.cos(angle) * radius + wobble,
      y: cy + Math.sin(angle) * radius + wobble * 0.5,
      branchIndex: i,
      branchColor: BRANCH_COLORS[i % BRANCH_COLORS.length],
    };
  });
}
