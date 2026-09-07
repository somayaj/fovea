import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import FocusPageShell from "../components/FocusPageShell.jsx";
import NodePanel from "../components/NodePanel.jsx";
import RoadmapCalendar from "../components/RoadmapCalendar.jsx";
import RoadmapDayPanel from "../components/RoadmapDayPanel.jsx";
import RoadmapTimeline from "../components/RoadmapTimeline.jsx";
import RoadmapYearCalendar from "../components/RoadmapYearCalendar.jsx";
import { MonthPager } from "../components/MonthPager.jsx";
import { PageHeader, SegmentedControl } from "../components/PageHeader.jsx";
import { YearPager } from "../components/YearPager.jsx";
import { useChannels } from "../context/ChannelsContext.jsx";
import { useFocusWeek } from "../context/FocusWeekContext.jsx";
import {
  calendarMonthFromOffset,
  emptyCalendarMonth,
  emptyCalendarYear,
  monthOffsetForKey,
} from "../lib/roadmapCalendar.js";
import { displayYear } from "../lib/roadmapBounds.js";
import { mergeBucketPage } from "../lib/roadmapTasks.js";
import { weekOffsetForDueAt } from "../lib/weekBounds.js";
import { IconCalendar, IconLayers, IconTimeline } from "../components/icons.jsx";
import { cn } from "../lib/tw.js";

const VIEW_MODES = [
  { id: "year", label: "Year", icon: <IconCalendar size={13} /> },
  { id: "month", label: "Month", icon: <IconLayers size={13} /> },
  { id: "timeline", label: "Timeline", icon: <IconTimeline size={13} /> },
];

export default function RoadmapView({ me }) {
  const projectId = me.project?.id;
  const { channels } = useChannels();
  const { setFocusWeekFromTask } = useFocusWeek();
  const [viewMode, setViewMode] = useState("year");
  const [yearOffset, setYearOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [calendarYear, setCalendarYear] = useState(emptyCalendarYear(new Date().getFullYear()));
  const [calendarMonth, setCalendarMonth] = useState(emptyCalendarMonth(""));
  const [activeDay, setActiveDay] = useState(null);
  const [dayBucket, setDayBucket] = useState(null);
  const [selected, setSelected] = useState(null);
  const [week, setWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dayLoading, setDayLoading] = useState(false);
  const [timeline, setTimeline] = useState({ channels: [], tasks: [] });
  const [error, setError] = useState("");

  const year = displayYear(yearOffset);
  const calendarParts = calendarMonthFromOffset(monthOffset);
  const taskWeekOffset = useMemo(() => weekOffsetForDueAt(selected?.due_at), [selected?.due_at]);

  const loadWeek = useCallback(async (nextWeek) => {
    if (nextWeek) {
      setWeek(nextWeek);
      return;
    }
    if (!projectId) return;
    try {
      const offset = selected ? taskWeekOffset : 0;
      const data = await api.week(offset, { neighborLimit: 1, neighborOffset: 0 });
      setWeek(data);
    } catch (err) {
      console.error(err);
    }
  }, [projectId, selected, taskWeekOffset]);

  const loadYear = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    setActiveDay(null);
    setDayBucket(null);
    try {
      const data = await api.roadmapCalendarYear(year);
      setCalendarYear(data);
    } catch (err) {
      setError(err.message || "Could not load year calendar");
    } finally {
      setLoading(false);
    }
  }, [projectId, year]);

  const loadCalendarMonth = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    setActiveDay(null);
    setDayBucket(null);
    try {
      const data = await api.roadmapCalendarMonth(calendarParts.monthKey);
      setCalendarMonth(data);
    } catch (err) {
      setError(err.message || "Could not load calendar");
    } finally {
      setLoading(false);
    }
  }, [projectId, calendarParts.monthKey]);

  const loadTimeline = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    setActiveDay(null);
    setDayBucket(null);
    try {
      const data = await api.roadmapTimeline(year);
      setTimeline({ channels: data.channels || [], tasks: data.tasks || [] });
    } catch (err) {
      setError(err.message || "Could not load timeline");
    } finally {
      setLoading(false);
    }
  }, [projectId, year]);

  const loadDay = async (dayKey, { append = false } = {}) => {
    if (!projectId || !dayKey) return;
    setDayLoading(true);
    try {
      const offset = append ? dayBucket?.tasks?.length || 0 : 0;
      const { bucket } = await api.roadmapCalendarDay(dayKey, { offset });
      setDayBucket((prev) => (append && prev ? mergeBucketPage(prev, bucket) : bucket));
      setActiveDay(dayKey);
    } catch (err) {
      setError(err.message || "Could not load day");
    } finally {
      setDayLoading(false);
    }
  };

  useEffect(() => {
    if (!projectId) return;
    loadWeek().catch(console.error);
  }, [projectId, loadWeek]);

  useEffect(() => {
    if (selected) setFocusWeekFromTask(selected);
  }, [selected, setFocusWeekFromTask]);

  useEffect(() => {
    if (viewMode === "year") {
      loadYear().catch(console.error);
    } else if (viewMode === "month") {
      loadCalendarMonth().catch(console.error);
    } else {
      loadTimeline().catch(console.error);
    }
  }, [viewMode, loadYear, loadCalendarMonth, loadTimeline]);

  const refresh = async () => {
    await loadWeek();
    if (viewMode === "year") {
      await loadYear();
    } else if (viewMode === "month") {
      await loadCalendarMonth();
    } else {
      await loadTimeline();
    }
    if (activeDay) await loadDay(activeDay);
  };

  const patchSelected = async (body) => {
    if (!selected) return;
    await api.patchNode(selected.id, body);
    setSelected(null);
    await refresh();
  };

  const deleteSelected = async () => {
    if (!selected) return;
    await api.deleteNode(selected.id);
    setSelected(null);
    await refresh();
  };

  const openMonth = (monthKey) => {
    setMonthOffset(monthOffsetForKey(monthKey));
    setViewMode("month");
  };

  const header = (
    <PageHeader
      icon={<IconCalendar size={13} />}
      eyebrow="Roadmap"
      title={viewMode === "month" ? calendarParts.label : String(year)}
      description={
        viewMode === "month"
          ? "Month calendar — counts per day. Click a busy day to open its task list."
          : viewMode === "timeline"
            ? "Workstreams across the year — each bar is a task on its due date."
            : "Year at a glance — twelve mini calendars with heatmap density. Click a day or zoom into a month."
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl value={viewMode} onChange={setViewMode} options={VIEW_MODES} />
          {viewMode === "month" ? (
            <MonthPager monthOffset={monthOffset} onChange={setMonthOffset} loading={loading} />
          ) : viewMode === "timeline" ? (
            <YearPager yearOffset={yearOffset} onChange={setYearOffset} loading={loading} />
          ) : (
            <YearPager yearOffset={yearOffset} onChange={setYearOffset} loading={loading} />
          )}
        </div>
      }
    />
  );

  const showDayPanel = Boolean(activeDay);

  return (
    <FocusPageShell fill className="overflow-hidden">
      {header}

      <div
        className={cn(
          "relative grid min-h-0 flex-1 grid-cols-1",
          showDayPanel ? "lg:grid-cols-[minmax(0,1fr)_280px_320px]" : "lg:grid-cols-[minmax(0,1fr)_320px]",
        )}
      >
        <div className="relative flex min-h-0 min-w-0 flex-col">
          {error ? (
            <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:mx-8">
              {error}
            </div>
          ) : null}

          <div className={cn("min-h-0 flex-1 overflow-y-auto", loading && "pointer-events-none opacity-60")}>
            <div className="px-5 py-6 md:px-8 md:py-8">
              {viewMode === "month" ? (
                <RoadmapCalendar
                  year={calendarParts.year}
                  month={calendarParts.month}
                  calendarMonth={calendarMonth}
                  activeDay={activeDay}
                  onOpenDay={(dayKey) => loadDay(dayKey).catch(console.error)}
                />
              ) : viewMode === "timeline" ? (
                <RoadmapTimeline
                  year={year}
                  channels={timeline.channels}
                  tasks={timeline.tasks}
                  selectedId={selected?.id}
                  onSelect={setSelected}
                />
              ) : (
                <RoadmapYearCalendar
                  year={year}
                  calendarYear={calendarYear}
                  activeDay={activeDay}
                  onOpenDay={(dayKey) => loadDay(dayKey).catch(console.error)}
                  onOpenMonth={openMonth}
                />
              )}
            </div>
          </div>
        </div>

        {showDayPanel ? (
          <RoadmapDayPanel
            dayKey={activeDay}
            bucket={dayBucket}
            channels={channels}
            selectedId={selected?.id}
            onSelect={setSelected}
            onClose={() => {
              setActiveDay(null);
              setDayBucket(null);
            }}
            onLoadMore={() => loadDay(activeDay, { append: true }).catch(console.error)}
            loadingMore={dayLoading}
          />
        ) : null}

        {selected ? (
          <div
            className="fixed inset-0 z-40 bg-stone-900/30 lg:hidden"
            onClick={() => setSelected(null)}
            aria-hidden="true"
          />
        ) : null}

        <NodePanel
          node={selected}
          projectId={projectId}
          channels={channels}
          weekFocusId={week?.focus?.id}
          weekFocusPinned={week?.focusPinned}
          weekOffset={taskWeekOffset}
          onWeekFocusChange={loadWeek}
          onChange={patchSelected}
          onDelete={deleteSelected}
          onClose={() => setSelected(null)}
        />
      </div>
    </FocusPageShell>
  );
}
