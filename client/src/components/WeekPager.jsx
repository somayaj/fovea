import { datesForWeekOffset } from "../lib/weekBounds.js";
import { cn } from "../lib/tw.js";
import { IconChevronLeft, IconChevronRight } from "./icons.jsx";

function formatWeekRange(start, end) {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  e.setDate(e.getDate() - 1);
  const opts = { month: "short", day: "numeric" };
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    return `${s.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${e.getDate()}`;
  }
  return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, opts)}`;
}

function weekEyebrow(offset) {
  if (offset === 0) return "This week";
  if (offset < 0) {
    const n = Math.abs(offset);
    return n === 1 ? "Last week" : `${n} weeks ago`;
  }
  return offset === 1 ? "Next week" : `${offset} weeks ahead`;
}

export function WeekPager({ offset = 0, onChange, loading = false }) {
  const { weekStart, weekEnd } = datesForWeekOffset(offset);
  const range = formatWeekRange(weekStart, weekEnd);
  const showThisWeek = offset !== 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center rounded-lg border border-line/80 bg-white/70 p-0.5 shadow-sm backdrop-blur-sm">
        <button
          type="button"
          onClick={() => onChange(offset - 1)}
          disabled={loading}
          aria-label="Previous week"
          className="flex h-8 w-8 items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-white hover:text-stone-900 disabled:opacity-40"
        >
          <IconChevronLeft size={15} />
        </button>
        <span className="min-w-[9.5rem] px-2 text-center text-xs font-medium tabular-nums text-stone-700">
          {loading ? "Loading…" : range || "—"}
        </span>
        <button
          type="button"
          onClick={() => onChange(offset + 1)}
          disabled={loading}
          aria-label="Next week"
          className="flex h-8 w-8 items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-white hover:text-stone-900 disabled:opacity-40"
        >
          <IconChevronRight size={15} />
        </button>
      </div>
      {showThisWeek ? (
        <button
          type="button"
          onClick={() => onChange(0)}
          disabled={loading}
          className={cn(
            "rounded-lg border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/15 disabled:opacity-40",
          )}
        >
          This week
        </button>
      ) : null}
    </div>
  );
}

export { formatWeekRange, weekEyebrow };
