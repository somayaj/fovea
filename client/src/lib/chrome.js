/** Sidebar chrome tokens. */
export const chrome = {
  shell: "bg-sidebar text-sidebar-text",
  border: "border-sidebar-border",
  bar: "border-b border-sidebar-border bg-sidebar text-sidebar-text",
  barLight: "border-b border-sidebar-border bg-sidebar-surface text-sidebar-text",
  surface: "bg-sidebar-surface",
  hover: "hover:bg-sidebar-hover",
  muted: "text-sidebar-muted",
  accent: "text-sidebar-accent",
  accentBg: "bg-sidebar-accent/15 text-sidebar-accent",
  navActive: "bg-sidebar-hover text-sidebar-text",
  navIdle: "text-sidebar-muted hover:bg-sidebar-hover/80 hover:text-sidebar-text",
  control: "border border-sidebar-border bg-sidebar-surface text-sidebar-text hover:border-sidebar-accent/30 hover:bg-sidebar-hover",
};

/** Page header chrome — may differ from sidebar (e.g. walnut theme). */
export const headerChrome = {
  bar: "border-b border-header-border bg-header text-header-text",
  border: "border-header-border",
  surface: "bg-header-surface",
  hover: "hover:bg-header-hover",
  muted: "text-header-muted",
  accent: "text-header-accent",
  accentBg: "bg-header-accent/15 text-header-accent",
  control:
    "inline-flex items-center justify-center gap-1.5 rounded-md border border-header-border bg-header-surface px-2.5 py-1.5 text-xs font-medium text-header-text transition-colors hover:border-header-accent/30 hover:bg-header-hover",
  btnSm:
    "inline-flex items-center justify-center gap-1.5 rounded-md bg-header-accent px-2.5 py-1.5 text-xs font-semibold text-[var(--color-on-accent,#fff)] transition-colors hover:opacity-90",
  input:
    "border border-header-border bg-header-surface text-header-text placeholder:text-header-muted focus-within:border-header-accent/40 focus-within:ring-header-accent/10",
};
