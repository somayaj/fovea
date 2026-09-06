import {
  buildCalendarCells,
  formatDayCount,
  formatDayLabel,
  heatLevel,
  isToday,
  WEEKDAY_LABELS,
} from "../lib/roadmapCalendar.js";
import { cn } from "../lib/tw.js";

export default function RoadmapCalendar({
  year,
  month,
  calendarMonth,
  activeDay,
  onOpenDay,
}) {
  const cells = buildCalendarCells(year, month);
  const days = calendarMonth?.days || {};
  const monthTotal = calendarMonth?.monthTotal || 0;

  return (
    <div className="roadmap-calendar mx-auto w-full max-w-5xl">
      <div className="roadmap-calendar-summary">
        <p className="roadmap-calendar-summary-text">
          {monthTotal.toLocaleString()} task{monthTotal === 1 ? "" : "s"} this month · click a day to open its list
        </p>
        {monthTotal > 0 ? (
          <span className="roadmap-calendar-summary-count">{formatDayCount(monthTotal)}</span>
        ) : null}
      </div>

      <div className="roadmap-calendar-shell">
        <div className="roadmap-calendar-weekdays" aria-hidden="true">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className="roadmap-calendar-weekday">{label}</span>
          ))}
        </div>

        <div className="roadmap-calendar-grid">
          {cells.map((cell) => {
            if (!cell.inMonth) {
              return <div key={cell.key} className="roadmap-calendar-day roadmap-calendar-day--pad" />;
            }

            const count = days[cell.key]?.count || 0;
            const level = heatLevel(count);
            const today = isToday(cell.date);
            const isActive = activeDay === cell.key;

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => onOpenDay(cell.key)}
                title={
                  count > 0
                    ? `${formatDayLabel(cell.key)} · ${count.toLocaleString()} task${count === 1 ? "" : "s"}`
                    : formatDayLabel(cell.key)
                }
                className={cn(
                  "roadmap-calendar-day",
                  today && "roadmap-calendar-day--today",
                  level > 0 && `roadmap-calendar-day--heat-${level}`,
                  isActive && "roadmap-calendar-day--active",
                  count > 0 && "roadmap-calendar-day--busy",
                )}
              >
                <span className="roadmap-calendar-day-number">{cell.date.getDate()}</span>
                {count > 0 ? (
                  <span className="roadmap-calendar-day-count">{formatDayCount(count)}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
