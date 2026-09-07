import { taskPhotoAlt, taskPhotoUrl } from "../lib/taskPhoto.js";
import { tw, cn } from "./ui.jsx";
import { IconCheck } from "./icons.jsx";

const RECAP_DEFAULT_LIMIT = 24;

function channelName(channels, id) {
  return channels?.find((channel) => channel.id === id)?.name;
}

function recapIconLabel(task, channels) {
  const channel = channelName(channels, task.channel_id);
  const parts = [task.title, channel ? `#${channel}` : null].filter(Boolean);
  return parts.join(" · ");
}

export default function WeekRecap({
  completedTasks = [],
  completedCount = 0,
  hasMoreCompleted = false,
  recapExpanded = false,
  recapLoading = false,
  channels = [],
  weekOffset = 0,
  onSelect,
  selectedId,
  onExpandRecap,
  onCollapseRecap,
}) {
  const isCurrentWeek = weekOffset === 0;
  const hiddenCount = Math.max(0, completedCount - completedTasks.length);

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
    ? `You completed ${completedCount.toLocaleString()} task${completedCount === 1 ? "" : "s"} this week`
    : `${completedCount.toLocaleString()} task${completedCount === 1 ? "" : "s"} completed that week`;

  const showingLabel =
    completedTasks.length < completedCount
      ? `Showing ${completedTasks.length.toLocaleString()} of ${completedCount.toLocaleString()}`
      : null;

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
            {showingLabel ? ` · ${showingLabel}` : ""}
          </p>
        </div>
      </div>

      <ul className="week-recap-list">
        {completedTasks.map((task) => (
          <li key={task.id} className="week-recap-item">
            <button
              type="button"
              onClick={() => onSelect?.(task)}
              aria-label={recapIconLabel(task, channels)}
              aria-pressed={selectedId === task.id}
              title={recapIconLabel(task, channels)}
              className={cn(
                "week-recap-icon-thumb",
                selectedId === task.id && "week-recap-icon-thumb--selected",
              )}
            >
              <img
                src={taskPhotoUrl(task)}
                alt={taskPhotoAlt(task)}
                className="week-recap-icon-thumb-img"
              />
            </button>
          </li>
        ))}
      </ul>

      {hasMoreCompleted || recapExpanded ? (
        <div className="week-recap-actions">
          {hasMoreCompleted ? (
            <button
              type="button"
              disabled={recapLoading}
              onClick={onExpandRecap}
              className={cn(tw.btnOutlineSm, "disabled:opacity-50")}
            >
              {recapLoading ? "Loading…" : `+${hiddenCount.toLocaleString()} more this week`}
            </button>
          ) : null}
          {recapExpanded && completedTasks.length > RECAP_DEFAULT_LIMIT ? (
            <button
              type="button"
              disabled={recapLoading}
              onClick={onCollapseRecap}
              className={cn(tw.btnOutlineSm, "disabled:opacity-50")}
            >
              Show less
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
