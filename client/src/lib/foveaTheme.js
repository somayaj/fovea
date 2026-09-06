/** Single app palette — instant-photo warm theme. */
export const PALETTE = {
  label: "Instant",
  swatch: "#c4956a",
  bg: "#f7f3ec",
  center: "#c4956a",
  centerDark: "#a67c52",
  centerGlow: "rgba(196, 149, 106, 0.22)",
  accentSoft: "#f0ebe3",
  surface: "#fdfbf7",
  nodes: ["#5c4a3a", "#786452", "#8b7355", "#3d3228"],
  line: "#e8dfd4",
  icon: "#3d3228",
  muted: "#8a7b6b",
  onAccent: "#ffffff",
};

export function getThemePalette() {
  return PALETTE;
}

export function branchColors(palette = PALETTE) {
  return [palette.center, ...palette.nodes, palette.centerDark];
}

export function focusBranchColors(palette = PALETTE) {
  return [...palette.nodes, palette.line, palette.muted];
}

export function priorityColors() {
  return {
    hub: PALETTE.center,
    p0: "#b4533a",
    p1: "#a06d3f",
    p2: "#5c4a3a",
    p3: "#8a7b6b",
    idea: PALETTE.muted,
  };
}

export function applyFoveaTheme() {
  const palette = PALETTE;

  if (typeof document === "undefined") return palette;

  const root = document.documentElement;
  root.style.setProperty("--color-paper", palette.bg);
  root.style.setProperty("--color-accent", palette.center);
  root.style.setProperty("--color-map-accent", palette.center);
  root.style.setProperty("--color-accent-soft", palette.accentSoft);
  root.style.setProperty("--color-line", palette.line);
  root.style.setProperty("--color-muted", palette.muted);
  root.style.setProperty("--color-surface", palette.surface);
  root.style.setProperty("--color-on-accent", palette.onAccent);
  root.style.setProperty("--theme-center-glow", palette.centerGlow);

  return palette;
}

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
