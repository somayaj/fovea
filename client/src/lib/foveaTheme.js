import {
  DEFAULT_THEME_ID,
  THEME_PRESETS,
  THEME_STORAGE_KEY,
  getStoredThemeId,
  getThemePreset,
  getHeaderTokens,
  getSidebarTokens,
  listThemePresets,
  resolveThemeId,
} from "./foveaThemes.js";

/** Active palette — `pearl` by default. */
export const PALETTE = THEME_PRESETS[DEFAULT_THEME_ID].palette;

export function getThemePalette(themeId) {
  return getThemePreset(themeId).palette;
}

export function branchColors(palette = PALETTE) {
  return [palette.center, ...palette.nodes, palette.centerDark];
}

export function focusBranchColors(palette = PALETTE) {
  return [...palette.nodes, palette.line, palette.muted];
}

export function priorityColors(palette = PALETTE) {
  return {
    hub: palette.center,
    p0: "#b4533a",
    p1: "#a06d3f",
    p2: "#5c4a3a",
    p3: palette.muted,
    idea: palette.muted,
  };
}

const DEFAULT_PRIORITY_TOKENS = {
  p0: { bg: "#faf0ec", fg: "#b4533a", border: "#e8cfc4" },
  p1: { bg: "#f7efe6", fg: "#a06d3f", border: "#e5d5c3" },
  p2: { bg: "#f3f0ea", fg: "#5c4a3a", border: "#e8dfd4" },
  p3: { bg: "#f7f5f1", fg: "#8a7b6b", border: "#ebe4d8" },
};

function applyPriorityTokens(root, priorities = DEFAULT_PRIORITY_TOKENS) {
  for (const [level, tokens] of Object.entries(priorities)) {
    root.style.setProperty(`--priority-${level}-bg`, tokens.bg);
    root.style.setProperty(`--priority-${level}-fg`, tokens.fg);
    root.style.setProperty(`--priority-${level}-border`, tokens.border);
  }
}

export function applyFoveaTheme(themeId = getStoredThemeId()) {
  const preset = getThemePreset(themeId);
  const palette = preset.palette;
  const sidebar = getSidebarTokens(preset);
  const header = getHeaderTokens(preset);

  if (typeof document === "undefined") return { preset, palette, sidebar, header };

  const root = document.documentElement;
  const resolvedId = resolveThemeId(themeId);

  root.dataset.foveaTheme = resolvedId;
  root.dataset.foveaNeutral = preset.neutral ? "true" : "false";
  root.dataset.sidebarDark = sidebar.dark ? "true" : "false";
  root.dataset.headerDark = header.dark ? "true" : "false";
  root.style.setProperty("--color-paper", palette.bg);
  root.style.setProperty("--color-accent", palette.center);
  root.style.setProperty("--color-map-accent", palette.center);
  root.style.setProperty("--color-accent-soft", palette.accentSoft);
  root.style.setProperty("--color-line", palette.line);
  root.style.setProperty("--color-muted", palette.muted);
  root.style.setProperty("--color-surface", palette.surface);
  root.style.setProperty("--color-on-accent", palette.onAccent);
  root.style.setProperty("--theme-center-glow", palette.centerGlow);
  root.style.setProperty("--color-wall", palette.wall || palette.accentSoft);
  root.style.setProperty("--color-brand", palette.brand || palette.icon);
  root.style.setProperty("--color-brand-dark", palette.brandDark || palette.centerDark);
  root.style.setProperty("--color-brand-soft", palette.brandSoft || palette.accentSoft);
  root.style.setProperty("--collage-photo-filter", preset.collage.photoFilter);
  root.style.setProperty("--collage-surface-mix", preset.collage.surfaceMix);
  applyPriorityTokens(root, preset.priorities);
  root.style.setProperty("--sidebar-bg", sidebar.bg);
  root.style.setProperty("--sidebar-surface", sidebar.surface);
  root.style.setProperty("--sidebar-border", sidebar.border);
  root.style.setProperty("--sidebar-text", sidebar.text);
  root.style.setProperty("--sidebar-muted", sidebar.muted);
  root.style.setProperty("--sidebar-hover", sidebar.hover);
  root.style.setProperty("--sidebar-accent", sidebar.accent);
  root.style.setProperty("--header-bg", header.bg);
  root.style.setProperty("--header-surface", header.surface);
  root.style.setProperty("--header-border", header.border);
  root.style.setProperty("--header-text", header.text);
  root.style.setProperty("--header-muted", header.muted);
  root.style.setProperty("--header-hover", header.hover);
  root.style.setProperty("--header-accent", header.accent);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, resolvedId);
  } catch {
    // ignore quota / private mode
  }

  return { preset, palette, sidebar, header };
}

export function setFoveaTheme(themeId) {
  return applyFoveaTheme(themeId);
}

export { DEFAULT_THEME_ID, THEME_PRESETS, getStoredThemeId, getThemePreset, getHeaderTokens, getSidebarTokens, listThemePresets };

export function workstreamColor(name, index = 0, palette = PALETTE) {
  const colors = branchColors(palette);
  const key = String(name || "").toLowerCase();
  const named = {
    ship: palette.center,
    design: palette.nodes[2],
    ops: palette.nodes[1],
  };
  if (named[key]) return named[key];
  return colors[index % colors.length];
}
