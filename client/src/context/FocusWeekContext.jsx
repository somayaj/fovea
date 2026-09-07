import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { weekOffsetForDueAt } from "../lib/weekBounds.js";

const FocusWeekContext = createContext(null);

export function FocusWeekProvider({ children }) {
  const [focusWeekOffset, setFocusWeekOffset] = useState(0);

  const setFocusWeekFromTask = useCallback((task) => {
    setFocusWeekOffset(weekOffsetForDueAt(task?.due_at));
  }, []);

  const focusPath = focusWeekOffset === 0 ? "/" : `/?week=${focusWeekOffset}`;

  const value = useMemo(
    () => ({ focusWeekOffset, setFocusWeekFromTask, focusPath }),
    [focusWeekOffset, setFocusWeekFromTask, focusPath],
  );

  return <FocusWeekContext.Provider value={value}>{children}</FocusWeekContext.Provider>;
}

export function useFocusWeek() {
  const ctx = useContext(FocusWeekContext);
  if (!ctx) throw new Error("useFocusWeek must be used within FocusWeekProvider");
  return ctx;
}
