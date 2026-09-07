import { Fragment, useMemo } from "react";
import { monthKeysForYear, monthLabel, taskMonthKey } from "../lib/roadmapBounds.js";
import { priorityMeta } from "../lib/priority.js";
import { workstreamColor } from "../lib/foveaTheme.js";
import { PriorityBadge } from "./ui.jsx";
import SidebarHoverLabel from "./SidebarHoverLabel.jsx";
import { cn } from "../lib/tw.js";

function groupTasksByChannel(tasks, channels) {
  const byChannel = new Map();
  for (const channel of channels) {
    byChannel.set(channel.id, []);
  }
  const unsorted = [];

  for (const task of tasks) {
    if (task.channel_id && byChannel.has(task.channel_id)) {
      byChannel.get(task.channel_id).push(task);
    } else {
      unsorted.push(task);
    }
  }

  const rows = channels.map((channel, index) => ({
    id: channel.id,
    name: channel.name,
    color: workstreamColor(channel.name, index),
    tasks: byChannel.get(channel.id) || [],
  }));

  if (unsorted.length > 0) {
    rows.push({
      id: "__unsorted__",
      name: "Unsorted",
      color: "#a8a29e",
      tasks: unsorted,
    });
  }

  return rows;
}

function tasksForMonth(tasks, monthKey) {
  return tasks.filter((task) => taskMonthKey(task) === monthKey);
}

function formatDueDay(task) {
  if (!task?.due_at) return "";
  const raw = String(task.due_at);
  if (raw.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return String(Number.parseInt(raw.slice(8, 10), 10));
  }
  const date = new Date(task.due_at);
  if (Number.isNaN(date.getTime())) return "";
  return String(date.getDate());
}

const TIMELINE_LABEL_WIDTH = "8.5rem";
const TIMELINE_MONTH_WIDTH = "5.75rem";

export default function RoadmapTimeline({ year, channels = [], tasks = [], selectedId, onSelect }) {
  const monthKeys = useMemo(() => monthKeysForYear(year), [year]);
  const rows = useMemo(() => groupTasksByChannel(tasks, channels), [tasks, channels]);
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    if (now.getFullYear() !== year) return null;
    return `${year}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, [year]);

  if (!tasks.length) {
    return (
      <div className="roadmap-timeline-empty">
        <p className="text-sm text-muted">No scheduled tasks for {year} yet.</p>
        <p className="mt-1 text-xs text-muted">Add due dates to tasks to see them on the timeline.</p>
      </div>
    );
  }

  return (
    <div className="roadmap-timeline-shell">
      <div className="roadmap-timeline-scroll">
        <div
          className="roadmap-timeline-grid"
          style={{
            gridTemplateColumns: `${TIMELINE_LABEL_WIDTH} repeat(${monthKeys.length}, ${TIMELINE_MONTH_WIDTH})`,
          }}
        >
          <div className="roadmap-timeline-corner" aria-hidden="true" />
          {monthKeys.map((monthKey) => (
            <div
              key={monthKey}
              className={cn(
                "roadmap-timeline-month-head",
                monthKey === currentMonthKey && "roadmap-timeline-month-head--current",
              )}
            >
              {monthLabel(monthKey)}
            </div>
          ))}

          {rows.map((row) => (
            <Fragment key={row.id}>
              <div className="roadmap-timeline-row-label group/rowtip relative">
                <span className="roadmap-timeline-row-dot" style={{ backgroundColor: row.color }} aria-hidden="true" />
                <span className="truncate">{row.name}</span>
                <SidebarHoverLabel
                  label={row.name}
                  meta={
                    row.tasks.length > 0
                      ? `${row.tasks.length} task${row.tasks.length === 1 ? "" : "s"}`
                      : null
                  }
                />
              </div>
              {monthKeys.map((monthKey) => {
                const monthTasks = tasksForMonth(row.tasks, monthKey);
                return (
                  <div
                    key={`${row.id}-${monthKey}`}
                    className={cn(
                      "roadmap-timeline-cell",
                      monthKey === currentMonthKey && "roadmap-timeline-cell--current",
                    )}
                  >
                    {monthTasks.length === 0 ? (
                      <span className="roadmap-timeline-cell-empty" aria-hidden="true" />
                    ) : (
                      <div className="roadmap-timeline-bars">
                        {monthTasks.map((task) => {
                          const priority = task.priority || "p2";
                          return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => onSelect?.(task)}
                            className={cn(
                              "roadmap-timeline-bar group/bartip relative",
                              `roadmap-timeline-bar--${priority}`,
                              selectedId === task.id && "roadmap-timeline-bar--selected",
                            )}
                          >
                            <PriorityBadge
                              priority={priority}
                              map
                              code
                              className="roadmap-timeline-bar-priority"
                            />
                            <span className="roadmap-timeline-bar-day">{formatDueDay(task)}</span>
                            <span className="roadmap-timeline-bar-title">{task.title}</span>
                            <SidebarHoverLabel
                              label={task.title}
                              meta={priorityMeta(priority).code}
                              placement="top"
                              wrap
                            />
                          </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
