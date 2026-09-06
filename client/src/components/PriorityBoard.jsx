import TypePin from "./TypePin.jsx";
import TaskPhoto from "./TaskPhoto.jsx";
import { PriorityBadge } from "./ui.jsx";
import { typeLabel } from "../lib/content.js";
import { compareByPriorityAndFrequency } from "../lib/radialLayout.js";
import { tw, cn } from "../lib/tw.js";

export default function PriorityBoard({
  nodes,
  channels,
  centerId,
  selectedId,
  onSelect,
  loadMoreRef,
  loadingMore = false,
  hasMore = false,
  emptyLabel = null,
}) {
  const sorted = [...nodes].sort((a, b) => {
    if (a.id === centerId) return -1;
    if (b.id === centerId) return 1;
    return compareByPriorityAndFrequency(a, b, []);
  });

  return (
    <div className="h-full overflow-auto px-4 py-4 md:px-6">
      <p className={cn(tw.label, "mb-4")}>Sorted by priority</p>
      {sorted.length === 0 && emptyLabel ? (
        <p className="py-8 text-center text-sm text-muted">{emptyLabel}</p>
      ) : (
      <ul className="space-y-1.5">
        {sorted.map((node) => {
          const channel = channels.find((c) => c.id === node.channel_id)?.name;
          const isFocus = node.id === centerId;

          return (
            <li key={node.id}>
              <button
                type="button"
                onClick={() => onSelect(node.id)}
                className={[
                  cn(tw.card, "priority-board-row flex w-full items-center text-left"),
                  selectedId === node.id ? "border-accent" : "",
                  isFocus ? "ring-1 ring-accent/30" : "",
                ].join(" ")}
              >
                <TaskPhoto
                  task={node}
                  channelName={channel}
                  size="sm"
                  rotate={0}
                  showTitle={false}
                  className="priority-board-polaroid shrink-0"
                  imageClassName="task-photo-map-img"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="priority-board-title font-medium text-brand">{node.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {typeLabel(node.type)}
                        {channel ? ` · #${channel}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {node.priority ? <PriorityBadge priority={node.priority} /> : null}
                      {isFocus ? <span className={tw.label}>Top focus</span> : null}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      )}
      {hasMore ? (
        <div ref={loadMoreRef} className="py-6 text-center text-sm text-muted">
          {loadingMore ? "Loading more tasks…" : ""}
        </div>
      ) : null}
    </div>
  );
}
