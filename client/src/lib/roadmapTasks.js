import { api } from "../api.js";
import { monthKeysForYear } from "./roadmapBounds.js";

export const ROADMAP_PAGE_SIZE = 24;
export const ROADMAP_CALENDAR_PAGE_SIZE = 48;
export const ROADMAP_CALENDAR_MAX_TASKS = 500;

export function emptyBucket(key) {
  return {
    key,
    total: 0,
    tasks: [],
    limit: ROADMAP_PAGE_SIZE,
    offset: 0,
    hasMore: false,
  };
}

export function bucketsFromYearResponse(data) {
  const map = { unscheduled: data.unscheduled || emptyBucket("unscheduled") };
  for (const bucket of data.months || []) {
    map[bucket.key] = bucket;
  }
  return map;
}

export function mergeBucketPage(existing, page) {
  const seen = new Set((existing.tasks || []).map((task) => task.id));
  const appended = (page.tasks || []).filter((task) => !seen.has(task.id));
  const tasks = [...(existing.tasks || []), ...appended];
  return {
    ...existing,
    ...page,
    tasks,
    hasMore: page.hasMore,
    total: page.total,
  };
}

export function bucketKeysForYear(year) {
  return ["unscheduled", ...monthKeysForYear(year)];
}

export function hiddenTaskCount(bucket) {
  if (!bucket) return 0;
  return Math.max(0, (bucket.total || 0) - (bucket.tasks?.length || 0));
}

export async function fetchRoadmapBucket(year, monthKey, { limit = ROADMAP_CALENDAR_PAGE_SIZE, max = ROADMAP_CALENDAR_MAX_TASKS } = {}) {
  const all = [];
  let offset = 0;
  let hasMore = true;
  let total = 0;

  while (hasMore && all.length < max) {
    const data = await api.roadmap(year, { month: monthKey, limit, offset });
    const bucket = data.bucket;
    total = bucket.total;
    all.push(...(bucket.tasks || []));
    hasMore = bucket.hasMore;
    offset += bucket.tasks?.length || 0;
    if (!bucket.tasks?.length) break;
  }

  return {
    key: monthKey,
    total,
    tasks: all,
    limit,
    offset: all.length,
    hasMore: all.length < total,
  };
}
