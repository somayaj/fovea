import {
  buildCalendarCells,
  formatDayCount,
  heatLevel,
  isToday,
  monthKeyFromParts,
} from "../lib/roadmapCalendar.js";
import { isCurrentMonth, monthLabel, monthTitle } from "../lib/roadmapBounds.js";
import { cn } from "../lib/tw.js";

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

export default function RoadmapYearCalendar({
  year,
  calendarYear,
  activeDay,
  onOpenDay,
  onOpenMonth,
}) {
  const days = calendarYear?.days || {};
  const monthTotals = calendarYear?.monthTotals || {};
  const yearTotal = calendarYear?.yearTotal || 0;
  const unscheduledTotal = calendarYear?.unscheduledTotal || 0;

  return (
    <div className="roadmap-year mx-auto w-full max-w-7xl">
      <p className="mb-5 text-sm text-muted">
        {yearTotal.toLocaleString()} task{yearTotal === 1 ? "" : "s"} scheduled in {year}
        {unscheduledTotal > 0
          ? ` · ${unscheduledTotal.toLocaleString()} unscheduled`
          : ""}
        . Click a day to open its task list, or a month name to zoom in.
      </p>

      <div className="roadmap-year-months">
        {Array.from({ length: 12 }, (_, index) => {
          const month = index + 1;
          const monthKey = monthKeyFromParts(year, month);
          const cells = buildCalendarCells(year, month);
          const monthTotal = monthTotals[monthKey] || 0;
          const isCurrent = isCurrentMonth(monthKey);

          return (
            <section
              key={monthKey}
              className={cn(
                "roadmap-year-month",
                isCurrent && "roadmap-year-month--current",
              )}
              aria-label={monthTitle(monthKey)}
            >
              <header className="roadmap-year-month-head">
                <button
                  type="button"
                  onClick={() => onOpenMonth?.(monthKey)}
                  className="roadmap-year-month-title"
                  title={`Open ${monthTitle(monthKey)}`}
                >
                  {monthLabel(monthKey)}
                </button>
                <span className="roadmap-year-month-count">
                  {monthTotal}
                </span>
              </header>

              <div className="roadmap-year-weekdays" aria-hidden="true">
                {WEEKDAY_INITIALS.map((label, weekdayIndex) => (
                  <span key={`${monthKey}-${weekdayIndex}`} className="roadmap-year-weekday">
                    {label}
                  </span>
                ))}
              </div>

              <div className="roadmap-year-grid">
                {cells.map((cell) => {
                  const count = days[cell.key] || 0;
                  const level = heatLevel(count);
                  const today = cell.inMonth && isToday(cell.date);
                  const isActive = activeDay === cell.key;

                  if (!cell.inMonth) {
                    return <div key={cell.key} className="roadmap-year-day roadmap-year-day--pad" />;
                  }

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => onOpenDay(cell.key)}
                      disabled={count === 0}
                      title={
                        count > 0
                          ? `${cell.date.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })} · ${count} task${count === 1 ? "" : "s"}`
                          : cell.date.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })
                      }
                      className={cn(
                        "roadmap-year-day",
                        today && "roadmap-year-day--today",
                        level > 0 && `roadmap-year-day--heat-${level}`,
                        isActive && "roadmap-year-day--active",
                        count > 0 && "roadmap-year-day--busy",
                      )}
                    >
                      <span className="roadmap-year-day-number">{cell.date.getDate()}</span>
                      {count > 0 ? (
                        <span className="roadmap-year-day-count" aria-hidden="true">
                          {formatDayCount(count)}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
