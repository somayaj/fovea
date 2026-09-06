import { calendarMonthFromOffset } from "../lib/roadmapCalendar.js";
import { headerChrome } from "../lib/chrome.js";
import { useDarkChrome } from "../lib/useDarkChrome.js";
import { cn } from "../lib/tw.js";
import { IconChevronLeft, IconChevronRight } from "./icons.jsx";

export function MonthPager({ monthOffset = 0, onChange, loading = false }) {
  const { label } = calendarMonthFromOffset(monthOffset);
  const showThisMonth = monthOffset !== 0;
  const dark = useDarkChrome();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className={cn(
          "inline-flex items-center rounded-lg border p-0.5",
          dark ? cn(headerChrome.border, headerChrome.surface) : "border-line/80 bg-accent-soft/45",
        )}
      >
        <button
          type="button"
          onClick={() => onChange(monthOffset - 1)}
          disabled={loading}
          aria-label="Previous month"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-40",
            dark
              ? cn(headerChrome.muted, "hover:bg-header-hover hover:text-header-text")
              : "text-stone-500 hover:bg-surface hover:text-stone-900",
          )}
        >
          <IconChevronLeft size={15} />
        </button>
        <span
          className={cn(
            "min-w-[9.5rem] px-2 text-center text-xs font-medium",
            dark ? "text-header-text" : "text-stone-700",
          )}
        >
          {loading ? "Loading…" : label}
        </span>
        <button
          type="button"
          onClick={() => onChange(monthOffset + 1)}
          disabled={loading}
          aria-label="Next month"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-40",
            dark
              ? cn(headerChrome.muted, "hover:bg-header-hover hover:text-header-text")
              : "text-stone-500 hover:bg-surface hover:text-stone-900",
          )}
        >
          <IconChevronRight size={15} />
        </button>
      </div>
      {showThisMonth ? (
        <button
          type="button"
          onClick={() => onChange(0)}
          disabled={loading}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40",
            dark
              ? "border-header-accent/30 bg-header-accent/12 text-header-accent hover:bg-header-accent/18"
              : "border-accent/25 bg-accent/10 text-accent hover:bg-accent/15",
          )}
        >
          This month
        </button>
      ) : null}
    </div>
  );
}
