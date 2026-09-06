import TaskPhoto from "./TaskPhoto.jsx";
import { isCurrentMonth, monthLabel, monthTitle } from "../lib/roadmapBounds.js";
import { hiddenTaskCount } from "../lib/roadmapTasks.js";
import { cn, tw } from "../lib/tw.js";

function channelName(channels, id) {
  return channels?.find((channel) => channel.id === id)?.name;
}

function formatDueMeta(task) {
  if (!task?.due_at) return undefined;
  const date = new Date(task.due_at);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function RoadmapMonthColumn({
  monthKey,
  label,
  bucket,
  channels,
  selectedId,
  onSelect,
  onLoadMore,
  loadingMore = false,
  variant = "month",
}) {
  const tasks = bucket?.tasks || [];
  const total = bucket?.total ?? tasks.length;
  const hidden = hiddenTaskCount(bucket);
  const isCurrent = variant === "month" && isCurrentMonth(monthKey);
  const title = variant === "unscheduled" ? label : monthTitle(monthKey);
  const shortLabel = variant === "unscheduled" ? label : monthLabel(monthKey);

  return (
    <section
      className={cn(
        "roadmap-month-column flex w-[min(100%,248px)] shrink-0 snap-center flex-col",
        isCurrent && "roadmap-month-column--current",
        variant === "unscheduled" && "roadmap-month-column--unscheduled",
      )}
      aria-label={title}
    >
      <header className="roadmap-month-header">
        <p className="roadmap-month-label">{shortLabel}</p>
        <p className="roadmap-month-count">
          {total} task{total === 1 ? "" : "s"}
          {hidden > 0 ? ` · ${tasks.length} shown` : ""}
        </p>
      </header>
      <div className="roadmap-month-body">
        {tasks.length === 0 ? (
          <p className="roadmap-month-empty">Nothing due</p>
        ) : (
          <ul className="roadmap-month-stack">
            {tasks.map((task, index) => {
              const channel = channelName(channels, task.channel_id);
              const due = formatDueMeta(task);
              const meta = [channel ? `#${channel}` : null, due].filter(Boolean).join(" · ");

              return (
                <li key={task.id} className="roadmap-month-item">
                  <TaskPhoto
                    task={task}
                    channelName={channel}
                    size="sm"
                    rotate={(index % 3) - 1}
                    label={task.priority ? task.priority.toUpperCase() : undefined}
                    meta={meta || undefined}
                    selected={selectedId === task.id}
                    onClick={() => onSelect(task)}
                    className="roadmap-polaroid"
                    imageClassName="task-photo-map-img"
                  />
                </li>
              );
            })}
          </ul>
        )}

        {hidden > 0 ? (
          <div className="roadmap-month-overflow">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => onLoadMore?.(monthKey)}
              className={cn(tw.btnOutlineSm, "roadmap-month-overflow-btn w-full justify-center")}
            >
              {loadingMore ? "Loading…" : `+${hidden} more`}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
