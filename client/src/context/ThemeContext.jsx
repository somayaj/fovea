import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  applyFoveaTheme,
  getStoredThemeId,
  getThemePreset,
  listThemePresets,
  setFoveaTheme,
} from "../lib/foveaTheme.js";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => getStoredThemeId());

  useEffect(() => {
    applyFoveaTheme(themeId);
  }, [themeId]);

  const setTheme = useCallback((nextId) => {
    setThemeId(nextId);
    setFoveaTheme(nextId);
  }, []);

  const preset = useMemo(() => getThemePreset(themeId), [themeId]);
  const palette = preset.palette;
  const presets = useMemo(() => listThemePresets(), []);

  const value = useMemo(
    () => ({ themeId, preset, palette, presets, setTheme }),
    [themeId, preset, palette, presets, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
