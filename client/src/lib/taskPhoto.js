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

function photoRev(task) {
  const value = Number(task?.photo_rev ?? task?.photoRev ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export function taskPhotoUrl(task, { role = "default" } = {}) {
  const custom = task?.image_url?.trim();
  if (custom) return custom;
  if (task?.id && hasCustomPhotoFlag(task)) {
    return `/api/nodes/${task.id}/photo?v=${photoRev(task)}`;
  }

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

export function isHttpPhotoUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

const MAX_PHOTO_EDGE = 1600;
const MAX_PHOTO_DATA_URL = 1_500_000;

function dataUrlFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

/** Compress an upload so PATCH can persist it (phone photos are often too large as raw data URLs). */
export async function fileToTaskImageUrl(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(bitmap.width, bitmap.height, 1));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process that image.");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    if (!dataUrl || dataUrl.length > MAX_PHOTO_DATA_URL) {
      throw new Error("Image is still too large after compressing. Try a smaller photo.");
    }
    return dataUrl;
  } catch (err) {
    if (err?.message?.includes("too large") || err?.message?.includes("Could not")) throw err;
    const dataUrl = await dataUrlFromFile(file);
    if (!dataUrl || dataUrl.length > MAX_PHOTO_DATA_URL) {
      throw new Error("Image is too large to save. Try a smaller JPEG or PNG.");
    }
    return dataUrl;
  }
}
