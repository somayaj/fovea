const POSITIONS_KEY = "fovea.roadmap.positions";
const CACHE_PREFIX = "fovea.roadmap.cache.";

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / private mode
  }
}

export function loadRoadmapPositions() {
  return readJson(POSITIONS_KEY, {});
}

export function saveRoadmapPosition(taskId, position) {
  const all = loadRoadmapPositions();
  all[taskId] = position;
  writeJson(POSITIONS_KEY, all);
}

export function loadRoadmapTaskCache(projectId) {
  if (!projectId) return null;
  return readJson(`${CACHE_PREFIX}${projectId}`, null);
}

export function saveRoadmapTaskCache(projectId, tasks) {
  if (!projectId) return;
  writeJson(`${CACHE_PREFIX}${projectId}`, {
    tasks,
    fetchedAt: new Date().toISOString(),
  });
}

/** Deterministic scatter when no saved position exists. */
export function defaultRoadmapPosition(taskId, index = 0) {
  let hash = 0;
  for (let i = 0; i < taskId.length; i += 1) {
    hash = (hash * 31 + taskId.charCodeAt(i)) | 0;
  }
  const x = 0.18 + ((hash & 0xff) / 255) * 0.64;
  const y = 0.12 + (((hash >> 8) & 0xff) + index * 29) % 72 / 100;
  const rotate = ((hash >> 16) % 7) - 3;
  return { x, y, rotate };
}
