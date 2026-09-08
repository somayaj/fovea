import {
  DEFAULT_THEME_ID,
  THEME_PRESETS,
  THEME_STORAGE_KEY,
  getStoredThemeId,
  getThemePreset,
  getHeaderTokens,
  getSidebarTokens,
  getThemePriorities,
  listThemePresets,
  resolveThemeId,
  SEMANTIC_PRIORITIES,
} from "./foveaThemes.js";

/** Active palette — `ember` by default. */
export const PALETTE = THEME_PRESETS[DEFAULT_THEME_ID].palette;

export function getThemePalette(themeId = getStoredThemeId()) {
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
    p0: SEMANTIC_PRIORITIES.p0.fg,
    p1: SEMANTIC_PRIORITIES.p1.fg,
    p2: SEMANTIC_PRIORITIES.p2.fg,
    p3: SEMANTIC_PRIORITIES.p3.fg,
    idea: palette.muted,
  };
}

const DEFAULT_PRIORITY_TOKENS = SEMANTIC_PRIORITIES;

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
  root.style.setProperty("--fovea-paper", palette.bg);
  root.style.setProperty("--fovea-accent", palette.center);
  root.style.setProperty("--fovea-map-accent", palette.center);
  root.style.setProperty("--fovea-accent-soft", palette.accentSoft);
  root.style.setProperty("--fovea-line", palette.line);
  root.style.setProperty("--fovea-muted", palette.muted);
  root.style.setProperty("--fovea-surface", palette.surface);
  root.style.setProperty("--fovea-on-accent", palette.onAccent);
  root.style.setProperty("--theme-center-glow", palette.centerGlow);
  root.style.setProperty("--fovea-wall", palette.wall || palette.accentSoft);
  root.style.setProperty("--fovea-brand", palette.brand || palette.icon);
  root.style.setProperty("--fovea-brand-dark", palette.brandDark || palette.centerDark);
  root.style.setProperty("--fovea-brand-soft", palette.brandSoft || palette.accentSoft);
  root.style.setProperty("--collage-photo-filter", preset.collage.photoFilter);
  root.style.setProperty("--collage-surface-mix", preset.collage.surfaceMix);
  applyPriorityTokens(root, getThemePriorities());
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

export { DEFAULT_THEME_ID, THEME_PRESETS, getStoredThemeId, getThemePreset, getHeaderTokens, getSidebarTokens, getThemePriorities, listThemePresets, resolveThemeId, SEMANTIC_PRIORITIES };

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
