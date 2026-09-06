/** Tailwind class recipes — instant-photo warm theme. */
export const tw = {
  label: "text-[11px] font-medium text-muted",
  labelAccent: "text-[11px] font-medium uppercase tracking-wide text-accent",
  card: "rounded-xl border border-line/80 bg-surface",
  input:
    "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-brand placeholder:text-muted focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10",
  btn:
    "inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[var(--color-on-accent,#fff)] transition-colors hover:opacity-90",
  btnOutline:
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-brand transition-colors hover:border-accent/30 hover:bg-accent-soft/40",
  btnSm:
    "inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-xs font-semibold text-[var(--color-on-accent,#fff)] transition-colors hover:opacity-90",
  btnOutlineSm:
    "inline-flex items-center justify-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/30 hover:bg-accent-soft/40 hover:text-brand",
  empty: "rounded-xl border border-dashed border-line bg-accent-soft/30 px-6 py-10 text-center",
  nav: "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-accent-soft/50 hover:text-stone-900",
  navActive: "bg-accent-soft/60 font-medium text-stone-900",
  segment:
    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
  segmentActive: "bg-surface text-stone-900",
  segmentIdle: "text-stone-500 hover:text-stone-800",
  panel: "border-line/80 bg-surface",
  surface: "bg-surface",
};

export function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function navLinkClass(isActive) {
  return cn(tw.nav, isActive && tw.navActive);
}
