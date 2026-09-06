import TaskPhoto from "./TaskPhoto.jsx";
import { IconFocus } from "./icons.jsx";
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

function EmptyPolaroid({ slot, size = "sm" }) {
  const sizeClass =
    size === "lg"
      ? "w-[min(44vw,220px)] sm:w-[230px]"
      : "w-[72px] sm:w-[84px]";

  return (
    <div
      className={cn(
        "focus-collage-piece focus-collage-empty-piece absolute -translate-x-1/2 -translate-y-1/2",
        sizeClass,
      )}
      style={{
        ...pct(slot),
        zIndex: slot.z ?? 2,
        "--instant-rotate": `${slot.rotate ?? 0}deg`,
      }}
    >
      <div className={cn("instant-photo", size === "lg" && "instant-photo-lg")}>
        <div
          className={cn(
            "instant-photo-well border border-dashed border-line/70",
            size === "lg" ? "flex aspect-[4/3] items-center justify-center" : "aspect-square",
          )}
        >
          {size === "lg" ? <IconFocus size={32} className="text-accent/35" strokeWidth={1.25} /> : null}
        </div>
        {size === "lg" ? (
          <div className="instant-photo-caption">
            <span className="instant-photo-label">This week&apos;s focus</span>
          </div>
        ) : null}
      </div>
    </div>
  );
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
          <>
            <div className="focus-collage-surface absolute inset-0" />
            {HERO_SLOTS.slice(0, 5).map((slot, i) => (
              <EmptyPolaroid key={i} slot={slot} />
            ))}
            <EmptyPolaroid slot={HERO_CENTER} size="lg" />
          </>
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
