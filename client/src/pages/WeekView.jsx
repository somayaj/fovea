import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import WeekDashboard from "../components/WeekDashboard.jsx";
import FocusPageShell from "../components/FocusPageShell.jsx";
import { IconFocus } from "../components/icons.jsx";

const NEIGHBOR_PAGE = 12;
const RECAP_DEFAULT_LIMIT = 24;
const RECAP_EXPANDED_LIMIT = 100;

function parseWeekOffset(searchParams) {
  return Number.parseInt(searchParams.get("week") ?? "0", 10) || 0;
}

export default function WeekView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const weekOffset = parseWeekOffset(searchParams);
  const [week, setWeek] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [recapLimit, setRecapLimit] = useState(RECAP_DEFAULT_LIMIT);
  const [recapLoading, setRecapLoading] = useState(false);
  const requestRef = useRef(0);

  const loadWeek = useCallback(async (offset, { append = false, neighborOffset = 0, completedLimit = RECAP_DEFAULT_LIMIT } = {}) => {
    const requestId = ++requestRef.current;
    if (!append) setLoading(true);
    else setLoadingMore(true);
    setError("");
    try {
      const data = await api.week(offset, {
        neighborLimit: NEIGHBOR_PAGE,
        neighborOffset,
        completedLimit,
        completedOffset: 0,
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
    setRecapLimit(RECAP_DEFAULT_LIMIT);
    loadWeek(weekOffset, { completedLimit: RECAP_DEFAULT_LIMIT }).catch(console.error);
  }, [loadWeek, weekOffset]);

  const handleWeekChange = (nextOffset) => {
    if (nextOffset === weekOffset) return;
    const next = new URLSearchParams(searchParams);
    if (nextOffset === 0) next.delete("week");
    else next.set("week", String(nextOffset));
    setSearchParams(next, { replace: true });
  };

  const handleLoadMoreNeighbors = () => {
    if (!week?.focus || loadingMore) return;
    const nextOffset = (week.neighbors?.length || 0);
    loadWeek(weekOffset, { append: true, neighborOffset: nextOffset }).catch(console.error);
  };

  const refreshWeek = useCallback(
    () => loadWeek(weekOffset, { completedLimit: recapLimit }),
    [loadWeek, weekOffset, recapLimit],
  );

  const handleExpandRecap = async () => {
    setRecapLoading(true);
    setRecapLimit(RECAP_EXPANDED_LIMIT);
    try {
      await loadWeek(weekOffset, { completedLimit: RECAP_EXPANDED_LIMIT });
    } finally {
      setRecapLoading(false);
    }
  };

  const handleCollapseRecap = async () => {
    setRecapLoading(true);
    setRecapLimit(RECAP_DEFAULT_LIMIT);
    try {
      await loadWeek(weekOffset, { completedLimit: RECAP_DEFAULT_LIMIT });
    } finally {
      setRecapLoading(false);
    }
  };

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
      recapExpanded={recapLimit > RECAP_DEFAULT_LIMIT}
      recapLoading={recapLoading}
      onExpandRecap={handleExpandRecap}
      onCollapseRecap={handleCollapseRecap}
    />
  );
}
