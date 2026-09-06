import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import WeekDashboard from "../components/WeekDashboard.jsx";
import FocusPageShell from "../components/FocusPageShell.jsx";
import { IconFocus } from "../components/icons.jsx";

const NEIGHBOR_PAGE = 12;

export default function WeekView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [week, setWeek] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestRef = useRef(0);

  const loadWeek = useCallback(async (offset, { append = false, neighborOffset = 0 } = {}) => {
    const requestId = ++requestRef.current;
    if (!append) setLoading(true);
    else setLoadingMore(true);
    setError("");
    try {
      const data = await api.week(offset, {
        neighborLimit: NEIGHBOR_PAGE,
        neighborOffset,
      });
      if (requestId !== requestRef.current) return;
      setWeek((prev) => {
        if (!append || !prev) return data;
        const seen = new Set((prev.neighbors || []).map((n) => n.id));
        const merged = [
          ...(prev.neighbors || []),
          ...(data.neighbors || []).filter((n) => !seen.has(n.id)),
        ];
        return {
          ...data,
          neighbors: merged,
        };
      });
      setWeekOffset(data.weekOffset ?? offset);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setError(err.message || "Could not load week");
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    loadWeek(0).catch(console.error);
  }, [loadWeek]);

  const handleWeekChange = (nextOffset) => {
    if (nextOffset === weekOffset) return;
    setWeekOffset(nextOffset);
    loadWeek(nextOffset).catch(console.error);
  };

  const handleLoadMoreNeighbors = () => {
    if (!week?.focus || loadingMore) return;
    const nextOffset = (week.neighbors?.length || 0);
    loadWeek(weekOffset, { append: true, neighborOffset: nextOffset }).catch(console.error);
  };

  const refreshWeek = useCallback(() => loadWeek(weekOffset), [loadWeek, weekOffset]);

  if (loading && !week) {
    return (
      <FocusPageShell fill className="overflow-y-auto">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-stone-400">
          <IconFocus size={20} className="animate-pulse text-accent/60" />
          <span className="text-xs font-medium">Loading your focus…</span>
        </div>
      </FocusPageShell>
    );
  }

  return (
    <WeekDashboard
      week={week}
      error={error}
      weekOffset={weekOffset}
      loading={loading}
      loadingMore={loadingMore}
      onWeekChange={handleWeekChange}
      onLoadMoreNeighbors={handleLoadMoreNeighbors}
      onRefresh={refreshWeek}
    />
  );
}
