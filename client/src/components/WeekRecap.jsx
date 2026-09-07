import TaskPhoto from "./TaskPhoto.jsx";
import { cn } from "../lib/tw.js";
import { IconCheck } from "./icons.jsx";

function channelName(channels, id) {
  return channels?.find((channel) => channel.id === id)?.name;
}

function formatCompletedWhen(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function WeekRecap({
  completedTasks = [],
  completedCount = 0,
  channels = [],
  weekOffset = 0,
  onSelect,
  selectedId,
}) {
  const isCurrentWeek = weekOffset === 0;

  if (!completedCount) {
    if (!isCurrentWeek) return null;
    return (
      <section className="week-recap week-recap--empty mx-auto mb-6 w-full max-w-3xl" aria-label="Weekly recap">
        <div className="week-recap-header">
          <span className="week-recap-icon week-recap-icon--muted" aria-hidden="true">
            <IconCheck size={14} />
          </span>
          <div>
            <p className="week-recap-title">Weekly recap</p>
            <p className="week-recap-subtitle">
              Mark tasks complete from the task panel — finished work shows up here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const title = isCurrentWeek
    ? `You completed ${completedCount} task${completedCount === 1 ? "" : "s"} this week`
    : `${completedCount} task${completedCount === 1 ? "" : "s"} completed that week`;

  return (
    <section className="week-recap mx-auto mb-6 w-full max-w-3xl" aria-label="Weekly recap">
      <div className="week-recap-header">
        <span className="week-recap-icon" aria-hidden="true">
          <IconCheck size={14} />
        </span>
        <div>
          <p className="week-recap-title">{title}</p>
          <p className="week-recap-subtitle">
            {isCurrentWeek ? "Nice work — here's what you shipped." : "A look back at what got done."}
          </p>
        </div>
      </div>

      <ul className="week-recap-list">
        {completedTasks.map((task, index) => {
          const channel = channelName(channels, task.channel_id);
          const when = formatCompletedWhen(task.completed_at);
          const meta = [channel ? `#${channel}` : null, when].filter(Boolean).join(" · ");

          return (
            <li key={task.id} className="week-recap-item">
              <TaskPhoto
                task={task}
                channelName={channel}
                size="sm"
                rotate={(index % 3) - 1}
                label={task.priority ? task.priority.toUpperCase() : undefined}
                meta={meta || undefined}
                selected={selectedId === task.id}
                onClick={() => onSelect?.(task)}
                className="week-recap-polaroid"
                imageClassName="task-photo-map-img"
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
