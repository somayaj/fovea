/**
 * Stock imagery for task polaroids.
 *
 * Keep defaults gender-neutral: use object/scene photos only (desk, tools,
 * nature, food, architecture) — no people. Custom uploads via task image_url
 * override stock for any task.
 */
export const IMAGES = {
  hero: "/images/fovea-hero.png",
  mapEmpty: "/images/fovea-all-tasks-instant.png",
  focus: "/images/fovea-focus.png",
  focusInstant: "/images/fovea-focus-instant.png",
  focusLanding: "/images/fovea-focus-landing.jpg",
  focusLandingWebp: "/images/fovea-focus-landing.webp",
  loginWork: "/images/login-hero-work.jpg",
  loginWoman: "/images/login-hero-woman.jpg",
  loginTeam: "/images/login-hero-team.jpg",
  allTasksInstant: "/images/fovea-all-tasks-instant.png",
  /** Object/scene stock — replace files in public/images/tasks/ with your own neutral photos */
  taskDefault: "/images/tasks/task-default.jpg",
  taskFocus: "/images/tasks/task-default.jpg",
  taskLinked: "/images/tasks/task-linked.jpg",
  taskRelated: "/images/tasks/task-related.jpg",
  taskSubtask: "/images/tasks/task-subtask.jpg",
  taskPriorityHigh: "/images/tasks/task-priority-high.jpg",
  taskPriorityLow: "/images/tasks/task-priority-low.jpg",
  /** Brainstorm idea cards — object scenes, no people */
  taskIdea: "/images/tasks/idea-1.jpg",
  theme: "/images/theme-hero.png",
};

/** Stock paths that should stay people-free for inclusive defaults. */
export const NEUTRAL_STOCK_IMAGES = [
  IMAGES.taskDefault,
  IMAGES.taskLinked,
  IMAGES.taskRelated,
  IMAGES.taskSubtask,
  IMAGES.taskPriorityHigh,
  IMAGES.taskPriorityLow,
];
