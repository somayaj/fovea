import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import FocusIllustration from "./FocusIllustration.jsx";
import FocusHero from "./FocusHero.jsx";
import FocusPageShell from "./FocusPageShell.jsx";
import NodePanel from "./NodePanel.jsx";
import WeekRecap from "./WeekRecap.jsx";
import { PageHeader, ActionLink } from "./PageHeader.jsx";
import { WeekPager, weekEyebrow } from "./WeekPager.jsx";
import { taskPhotoRole } from "../lib/taskPhoto.js";
import { tw, cn } from "./ui.jsx";
import { IconFocus, IconHash, IconMap, IconPlus } from "./icons.jsx";

function channelName(channels, id) {
  return channels?.find((c) => c.id === id)?.name;
}

function groupNeighbors(focusId, neighbors, edges) {
  const linkedIds = new Set();
  for (const edge of edges || []) {
    if (edge.source_id === focusId) linkedIds.add(edge.target_id);
    if (edge.target_id === focusId) linkedIds.add(edge.source_id);
  }

  const linked = [];
  const related = [];

  for (const node of neighbors || []) {
    if (node.neighborKind === "linked" || linkedIds.has(node.id)) linked.push(node);
    else related.push(node);
  }

  return { linked, related };
}

function weekToolbar({ weekOffset, loading, onWeekChange }) {
  return (
    <WeekPager
      offset={weekOffset}
      onChange={onWeekChange}
      loading={loading}
    />
  );
}

export default function WeekDashboard({
  week,
  error,
  weekOffset = 0,
  loading = false,
  loadingMore = false,
  onWeekChange,
  onLoadMoreNeighbors,
  onRefresh,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const focus = week?.focus;
  const neighbors = week?.neighbors || [];
  const { linked, related } = groupNeighbors(focus?.id, neighbors, week?.edges);
  const focusChannel = channelName(week?.channels, focus?.channel_id);
  const eyebrow = weekEyebrow(weekOffset);
  const projectId = week?.project?.id;

  const allTasks = useMemo(
    () => [focus, ...neighbors, ...(week?.completedTasks || [])].filter(Boolean),
    [focus, neighbors, week?.completedTasks],
  );
  const selected = allTasks.find((t) => t.id === selectedId) || null;
  const selectedPhotoRole = useMemo(
    () => taskPhotoRole(selected, { focus, linked, related }),
    [selected, focus, linked, related],
  );

  useEffect(() => {
    setSelectedId(null);
  }, [focus?.id, weekOffset]);

  const patchSelected = async (body) => {
    if (!selected) return;
    await api.patchNode(selected.id, body);
    await onRefresh?.();
  };

  const deleteSelected = async () => {
    if (!selected) return;
    await api.deleteNode(selected.id);
    setSelectedId(null);
    await onRefresh?.();
  };

  if (!week) {
    return (
      <FocusPageShell fill className="overflow-y-auto">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : (
            <>
              <IconFocus size={20} className="animate-pulse text-accent/60" />
              <span className="text-sm text-muted">Loading your focus…</span>
            </>
          )}
        </div>
      </FocusPageShell>
    );
  }

  const header = (
    <PageHeader
      icon={<IconFocus size={13} />}
      eyebrow={eyebrow}
      title="Your focus"
      description={
        weekOffset === 0
          ? "Your top task front and center — everything due this week stays visible around it."
          : "Here's what was at the center that week."
      }
      actions={
        <>
          <ActionLink to="/map" icon={<IconMap size={13} />}>All tasks</ActionLink>
          {focus && focusChannel ? (
            <ActionLink to={`/map?channel=${focus.channel_id}`} icon={<IconHash size={13} />}>
              {focusChannel}
            </ActionLink>
          ) : null}
        </>
      }
      toolbar={weekToolbar({ weekOffset, loading, onWeekChange })}
    />
  );

  if (!focus) {
    const hasWeekTasks = (week.weekTaskCount ?? 0) > 0;
    const isCurrentWeek = weekOffset === 0;
    const emptyTitle = hasWeekTasks
      ? (isCurrentWeek ? "Pick a focus" : "No focus pinned")
      : (isCurrentWeek ? "Nothing due yet" : "Quiet week");
    const emptyDescription = hasWeekTasks
      ? (isCurrentWeek
          ? "Open All tasks and pin one as this week's focus."
          : "Nothing was pinned that week. Jump back to this week or browse your task map.")
      : (isCurrentWeek
          ? "Add a task with a due date this week, or browse your map to schedule something."
          : "Nothing was scheduled that week. Jump back to this week or browse your map.");

    return (
      <FocusPageShell fill className="overflow-y-auto">
        {header}

        <div className="relative grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_320px]">
          <div className="flex-1 px-5 py-8 md:px-8 md:py-10">
            {error ? (
              <div className="mx-auto mb-6 max-w-lg rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className={cn("mx-auto flex w-full max-w-3xl flex-col items-center", loading && "pointer-events-none opacity-60")}>
              <WeekRecap
                completedTasks={week.completedTasks}
                completedCount={week.completedCount}
                channels={week.channels}
                weekOffset={weekOffset}
                selectedId={selectedId}
                onSelect={(task) => setSelectedId(task.id)}
              />

              <p className="mb-5 max-w-md text-center text-sm leading-relaxed text-muted">
                {week.reason}
              </p>

              {week.weekTaskCount > 0 ? (
                <p className="mb-4 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                  {week.weekTaskCount.toLocaleString()} task{week.weekTaskCount === 1 ? "" : "s"} due this week
                </p>
              ) : null}

              <div className="focus-hero-frame w-full">
                <FocusIllustration className="w-full" />
              </div>

              <div className={cn(tw.card, "mt-8 w-full max-w-md p-6 text-center")}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <IconFocus size={22} />
                </div>
                <p className={tw.label}>{emptyTitle}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{emptyDescription}</p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  <Link to="/map" className={cn(tw.btn, "inline-flex items-center gap-2")}>
                    <IconPlus size={14} />
                    {weekOffset === 0 ? "Add a task" : "Browse tasks"}
                  </Link>
                  {weekOffset !== 0 && onWeekChange ? (
                    <button
                      type="button"
                      onClick={() => onWeekChange(0)}
                      className={tw.btnOutlineSm}
                    >
                      This week
                    </button>
                  ) : (
                    <Link to="/map" className={cn(tw.btnOutlineSm, "inline-flex items-center gap-1.5")}>
                      <IconMap size={13} />
                      All tasks
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {selected ? (
            <div
              className="fixed inset-0 z-40 bg-brand-dark/25 lg:hidden"
              onClick={() => setSelectedId(null)}
              aria-hidden="true"
            />
          ) : null}

          <NodePanel
            node={selected}
            projectId={projectId}
            channels={week.channels}
            weekOffset={weekOffset}
            onChange={patchSelected}
            onDelete={deleteSelected}
            onClose={() => setSelectedId(null)}
          />
        </div>
      </FocusPageShell>
    );
  }

  return (
    <FocusPageShell fill className="overflow-y-auto">
      {header}

      <div className="relative grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_320px]">
        <div className="flex-1 px-5 py-8 md:px-8 md:py-10">
          {error ? (
            <div className="mx-auto mb-6 max-w-lg rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className={cn(loading && "pointer-events-none opacity-60")}>
            <WeekRecap
              completedTasks={week.completedTasks}
              completedCount={week.completedCount}
              channels={week.channels}
              weekOffset={weekOffset}
              selectedId={selectedId}
              onSelect={(task) => setSelectedId(task.id)}
            />

            <FocusHero
              key={`${weekOffset}-${focus.id}`}
              weekOffset={weekOffset}
              focus={focus}
              linked={linked}
              related={related}
              channels={week.channels}
              focusChannel={focusChannel}
              reason={week.reason}
              fallback={week.fallback}
              neighborTotal={week.neighborTotal ?? neighbors.length}
              weekTaskCount={week.weekTaskCount}
              loadingMore={loadingMore}
              onLoadMoreNeighbors={onLoadMoreNeighbors}
              selectedTaskId={selectedId}
              onTaskSelect={(task) => setSelectedId(task.id)}
            />
          </div>
        </div>

        {selected ? (
          <div
            className="fixed inset-0 z-40 bg-brand-dark/25 lg:hidden"
            onClick={() => setSelectedId(null)}
            aria-hidden="true"
          />
        ) : null}

        <NodePanel
          node={selected}
          photoRole={selectedPhotoRole}
          projectId={projectId}
          channels={week.channels}
          weekFocusId={focus?.id}
          weekFocusPinned={week?.focusPinned}
          weekOffset={weekOffset}
          onWeekFocusChange={onRefresh}
          onChange={patchSelected}
          onDelete={deleteSelected}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </FocusPageShell>
  );
}
