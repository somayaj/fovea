import { IMAGES } from "../lib/images.js";
import TaskPhoto from "./TaskPhoto.jsx";
import { cn } from "../lib/tw.js";
import {
  HERO_CENTER,
  HERO_SLOTS,
  HERO_VIEW_H,
  HERO_VIEW_W,
  organizedPositions,
} from "../lib/focusLayout.js";

export {
  HERO_CENTER,
  HERO_SLOTS,
  HERO_VIEW_W,
  HERO_VIEW_H,
  FOCUS_VIEW_W,
  FOCUS_VIEW_H,
  FOCUS_CENTER,
  FOCUS_SLOTS,
  heroSlotPosition,
  focusSlotPosition,
} from "../lib/focusLayout.js";

function pct({ x, y }) {
  return { left: `${x * 100}%`, top: `${y * 100}%` };
}

function buildSatelliteList(linked, related, limit = 12) {
  return [
    ...linked.map((task) => ({ task, kind: "linked" })),
    ...related.map((task) => ({ task, kind: "related" })),
  ].slice(0, limit);
}

/** Instant-photo collage — focus in the center, other tasks scattered around it. */
export default function FocusIllustration({
  className = "",
  linked = [],
  related = [],
  focusTask = null,
  focusChannel = null,
  selectedTaskId = null,
  onTaskSelect,
  children,
}) {
  const satellites = buildSatelliteList(linked, related);
  const positions = organizedPositions(satellites, focusTask);
  const isEmpty = !focusTask && satellites.length === 0;

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className="focus-collage relative overflow-hidden rounded-2xl border border-line/70 shadow-sm"
        style={{ aspectRatio: `${HERO_VIEW_W} / ${HERO_VIEW_H}`, minHeight: "min(70vw, 420px)" }}
      >
        {isEmpty ? (
          <img
            src={IMAGES.focusInstant}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="focus-collage-surface absolute inset-0" />
        )}

        {satellites.map(({ task, kind }, i) => {
          const slot = positions[task.id] || HERO_SLOTS[i];
          if (!slot) return null;
          return (
            <div
              key={task.id}
              className="focus-collage-piece focus-satellite absolute z-10 w-[108px] -translate-x-1/2 -translate-y-1/2 sm:w-[124px]"
              style={{
                ...pct(slot),
                zIndex: slot.z ?? 2 + (i % 4),
                animationDelay: `${i * 80}ms`,
              }}
            >
              <TaskPhoto
                task={task}
                photoRole={kind === "linked" ? "linked" : "related"}
                size="sm"
                rotate={slot.rotate ?? 0}
                showTitle
                selected={selectedTaskId === task.id}
                onClick={onTaskSelect ? () => onTaskSelect(task) : undefined}
                className="w-full"
              />
            </div>
          );
        })}

        {focusTask ? (
          <div
            className="focus-collage-piece focus-collage-focus absolute z-20 w-[min(44vw,220px)] -translate-x-1/2 -translate-y-1/2 sm:w-[230px]"
            style={{
              ...pct(positions[focusTask.id] || HERO_CENTER),
              zIndex: 20,
            }}
          >
            <TaskPhoto
              task={focusTask}
              channelName={focusChannel}
              photoRole="focus"
              size="lg"
              rotate={positions[focusTask.id]?.rotate ?? 0}
              label="This week's focus"
              showTitle
              selected={selectedTaskId === focusTask.id}
              onClick={onTaskSelect ? () => onTaskSelect(focusTask) : undefined}
              className="w-full"
            />
          </div>
        ) : null}

        {children}
      </div>
    </div>
  );
}
