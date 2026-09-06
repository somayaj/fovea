const PRIORITY_RANK = { p0: 0, p1: 1, p2: 2, p3: 3 };

function compareWeekTasks(a, b) {
  const ap = PRIORITY_RANK[a.priority] ?? 9;
  const bp = PRIORITY_RANK[b.priority] ?? 9;
  if (ap !== bp) return ap - bp;

  const dueA = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
  const dueB = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
  if (dueA !== dueB) return dueA - dueB;

  const hoursA = a.estimate_hours ?? 99;
  const hoursB = b.estimate_hours ?? 99;
  if (hoursA !== hoursB) return hoursA - hoursB;

  return String(a.title || "").localeCompare(String(b.title || ""));
}

function groupNeighbors(focusId, neighbors, edges) {
  const linkedIds = new Set();
  for (const edge of edges || []) {
    if (edge.source_id === focusId) linkedIds.add(edge.target_id);
    if (edge.target_id === focusId) linkedIds.add(edge.source_id);
  }

  const linked = [];
  const related = [];

  for (const node of neighbors || []) {
    if (linkedIds.has(node.id)) linked.push(node);
    else related.push(node);
  }

  return { linked, related };
}

/** Focus first, then linked, then related — each group sorted by urgency. */
export function buildWeekTaskOrder(week) {
  if (!week?.focus) {
    return { orderedIds: [], rankById: new Map(), linkedIds: new Set() };
  }

  const { linked, related } = groupNeighbors(week.focus.id, week.neighbors, week.edges);
  const sortedLinked = [...linked].sort(compareWeekTasks);
  const sortedRelated = [...related].sort(compareWeekTasks);
  const orderedIds = [
    week.focus.id,
    ...sortedLinked.map((n) => n.id),
    ...sortedRelated.map((n) => n.id),
  ];
  const rankById = new Map(orderedIds.map((id, index) => [id, index + 1]));
  const linkedIds = new Set(sortedLinked.map((n) => n.id));

  return { orderedIds, rankById, linkedIds };
}
