import { Link } from "react-router-dom";
import FocusIllustration from "./FocusIllustration.jsx";
import { formatFocusReason } from "../lib/content.js";
import { PriorityBadge, tw, cn } from "./ui.jsx";
import { IconHash, IconMap } from "./icons.jsx";

const BOARD_LIMIT = 12;
const PRIORITY_RANK = { p0: 0, p1: 1, p2: 2, p3: 3 };

function sortByPriority(tasks) {
  return [...tasks].sort(
    (a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9),
  );
}

function formatCount(n) {
  if (n == null) return null;
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
}

export default function FocusHero({
  focus,
  linked,
  related,
  focusChannel,
  reason,
  fallback,
  neighborTotal = 0,
  weekTaskCount,
  loadingMore = false,
  onLoadMoreNeighbors,
  selectedTaskId = null,
  onTaskSelect,
}) {
  const why = formatFocusReason(reason, fallback);
  const linkedSorted = sortByPriority(linked);
  const relatedSorted = sortByPriority(related);
  const otherTasks = [...linkedSorted, ...relatedSorted];
  const loadedCount = otherTasks.length;
  const totalNeighbors = neighborTotal || loadedCount;
  const hasMore = loadedCount < totalNeighbors;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
      <p className="mb-5 max-w-md text-center text-sm leading-relaxed text-muted">{why}</p>

      {weekTaskCount != null ? (
        <p className="mb-4 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
          {formatCount(weekTaskCount)} tasks this week
          {totalNeighbors > 0 ? ` · ${formatCount(totalNeighbors)} nearby` : ""}
        </p>
      ) : null}

      <div className="focus-hero-frame w-full">
        <FocusIllustration
          className="w-full"
          linked={linkedSorted}
          related={relatedSorted}
          focusTask={focus}
          focusChannel={focusChannel}
          selectedTaskId={selectedTaskId}
          onTaskSelect={onTaskSelect}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <PriorityBadge priority={focus.priority || "p2"} />
        {focusChannel ? (
          <span className="text-xs font-medium text-muted">#{focusChannel}</span>
        ) : null}
      </div>

      {otherTasks.length > BOARD_LIMIT ? (
        <div className="mt-8 w-full">
          <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            More tasks · {loadedCount} of {formatCount(totalNeighbors)}
          </p>
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-line/70 bg-surface p-2">
            {otherTasks.slice(BOARD_LIMIT).map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => onTaskSelect?.(task)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-brand hover:bg-paper",
                    selectedTaskId === task.id &&
                      "bg-accent-soft/40 ring-1 ring-accent/35",
                  )}
                >
                  {task.title}
                </button>
              </li>
            ))}
          </ul>
          {hasMore && onLoadMoreNeighbors ? (
            <button
              type="button"
              onClick={onLoadMoreNeighbors}
              disabled={loadingMore}
              className={cn(tw.btnOutlineSm, "mt-3 w-full justify-center disabled:opacity-50")}
            >
              {loadingMore ? "Loading…" : `Load more (${formatCount(totalNeighbors - loadedCount)} remaining)`}
            </button>
          ) : null}
        </div>
      ) : null}

      {focus.notes ? (
        <p className="mt-5 max-w-md text-center text-sm leading-relaxed text-muted">{focus.notes}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link to="/map" className={cn(tw.btnOutlineSm, "gap-1.5")}>
          <IconMap size={13} />
          See on map
        </Link>
        {focusChannel && focus.channel_id ? (
          <Link to={`/map?channel=${focus.channel_id}`} className={cn(tw.btnOutlineSm, "gap-1.5")}>
            <IconHash size={13} />
            {focusChannel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
