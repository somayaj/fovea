export const DEFAULT_THEME_ID = "ember";

const THEME_IDS = new Set([
  "walnut",
  "espresso",
  "sage",
  "ink",
  "stone",
  "ash",
  "white",
  "snow",
  "pearl",
  "frost",
  "linen",
  "slate",
  "graphite",
  "ember",
  "mono",
]);

export function isValidThemeId(themeId) {
  const id = String(themeId || "").trim().toLowerCase();
  return THEME_IDS.has(id);
}

export function normalizeThemeId(themeId) {
  const id = String(themeId || "").trim().toLowerCase();
  return isValidThemeId(id) ? id : null;
}
