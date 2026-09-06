import { formatDayLabel } from "../lib/roadmapCalendar.js";
import { PriorityBadge } from "./ui.jsx";
import { cn, tw } from "../lib/tw.js";

function channelName(channels, id) {
  return channels?.find((channel) => channel.id === id)?.name;
}

export default function RoadmapDayPanel({
  dayKey,
  bucket,
  channels,
  selectedId,
  onSelect,
  onClose,
  onLoadMore,
  loadingMore = false,
}) {
  if (!dayKey || !bucket) return null;

  const tasks = bucket.tasks || [];
  const hidden = Math.max(0, (bucket.total || 0) - tasks.length);

  return (
    <aside className="roadmap-day-panel fixed inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-line/80 bg-surface shadow-xl lg:static lg:z-auto lg:max-w-xs lg:shadow-none">
      <div className="flex items-start justify-between gap-3 border-b border-line/80 px-4 py-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Day</p>
          <h2 className="mt-1 text-base font-semibold text-brand">{formatDayLabel(dayKey)}</h2>
          <p className="mt-1 text-xs text-muted">
            {bucket.total} task{bucket.total === 1 ? "" : "s"} due
          </p>
        </div>
        <button type="button" onClick={onClose} className={tw.btnOutlineSm}>
          Close
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {tasks.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted">No tasks due this day.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => {
              const channel = channelName(channels, task.channel_id);
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(task)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                      selectedId === task.id
                        ? "border-accent bg-accent/10"
                        : "border-line/80 bg-paper hover:border-accent/30",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-brand">{task.title}</p>
                      {task.priority ? <PriorityBadge priority={task.priority} /> : null}
                    </div>
                    {channel ? <p className="mt-1 text-xs text-muted">#{channel}</p> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {bucket.hasMore ? (
          <div className="mt-4 px-1">
            <button
              type="button"
              disabled={loadingMore}
              onClick={onLoadMore}
              className={cn(tw.btnOutlineSm, "w-full justify-center disabled:opacity-50")}
            >
              {loadingMore ? "Loading…" : `Load more${hidden > 0 ? ` (${hidden} left)` : ""}`}
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
