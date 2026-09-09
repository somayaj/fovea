import { IMAGES } from "./images.js";

const HIGH_PRIORITY = new Set(["p0", "p1"]);
const LOW_PRIORITY = new Set(["p3"]);

/**
 * Photo for a task — custom image_url first, then role/priority stock from the hero theme.
 * @param {object} task
 * @param {{ role?: "focus" | "linked" | "related" | "default" }} [options]
 */
function hasCustomPhotoFlag(task) {
  const flag = task?.has_custom_photo ?? task?.hasCustomPhoto;
  return flag === true || flag === 1 || flag === "1";
}

export function taskPhotoUrl(task, { role = "default" } = {}) {
  const custom = task?.image_url?.trim();
  if (custom) return custom;
  if (task?.id && hasCustomPhotoFlag(task)) return `/api/nodes/${task.id}/photo`;

  const priority = task?.priority || "p2";

  if (role === "focus") return IMAGES.taskFocus;

  if (HIGH_PRIORITY.has(priority)) {
    if (role === "linked") return IMAGES.taskSubtask;
    if (role === "related") return IMAGES.taskPriorityHigh;
    return IMAGES.taskPriorityHigh;
  }

  if (LOW_PRIORITY.has(priority)) return IMAGES.taskPriorityLow;

  if (role === "linked") return IMAGES.taskLinked;
  if (role === "related") return IMAGES.taskRelated;

  // Ideas — neutral object stock (varies slightly per card)
  if (task?.type === "idea") {
    const pool = [IMAGES.taskIdea, IMAGES.taskRelated, IMAGES.taskDefault];
    const key = task?.id?.charCodeAt(0) ?? 0;
    return pool[key % pool.length];
  }

  return IMAGES.taskDefault;
}

/** Whether this task uses a user-uploaded image instead of stock. */
export function taskHasCustomPhoto(task) {
  return Boolean(task?.image_url?.trim() || hasCustomPhotoFlag(task));
}

/** Match collage role for a task on the focus board. */
export function taskPhotoRole(task, { focus, linked = [], related = [] } = {}) {
  if (!task) return "default";
  if (focus?.id === task.id) return "focus";
  if (linked.some((t) => t.id === task.id)) return "linked";
  if (related.some((t) => t.id === task.id)) return "related";
  return "default";
}

export function taskPhotoAlt(task) {
  return task?.title ? `Photo for task: ${task.title}` : "Task photo";
}
