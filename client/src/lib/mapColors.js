import { getThemePalette, branchColors, focusBranchColors, priorityColors, workstreamColor } from "./foveaTheme.js";

export function getAccent() {
  return getThemePalette().center;
}

export function getAccentDark() {
  return getThemePalette().centerDark;
}

export function getAccentSoft() {
  return getThemePalette().accentSoft;
}

export function getHubColor() {
  return getThemePalette().center;
}

export { branchColors as getBranchColors, focusBranchColors as getFocusBranchColors };

export function colorForNode(node, isHub) {
  const colors = priorityColors();
  if (isHub) return colors.hub;
  if (node.type === "idea") return colors.idea;
  return colors[node.priority] || colors.p2;
}

export { workstreamColor };

export const STAT_ACCENT_COLORS = null;

/** @deprecated Use getBranchColors() — kept for gradual migration */
export const BRANCH_COLORS = branchColors();
export const FOCUS_BRANCH_COLORS = focusBranchColors();
export const ACCENT = getAccent();
export const HUB_COLOR = getHubColor();
export const WORD_COLORS = BRANCH_COLORS;
export const PRIORITY_COLORS = priorityColors();
