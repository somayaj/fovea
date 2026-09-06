import { createContext, useContext, useEffect, useMemo } from "react";
import { applyFoveaTheme, getThemePalette } from "../lib/foveaTheme.js";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  useEffect(() => {
    applyFoveaTheme();
  }, []);

  const palette = useMemo(() => getThemePalette(), []);

  const value = useMemo(() => ({ palette }), [palette]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
