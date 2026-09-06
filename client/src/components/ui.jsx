import { tw, cn } from "../lib/tw.js";
import { priorityBadgeClass, priorityLabel } from "../lib/priority.js";

export function Label({ children, className = "", as = "p" }) {
  const Tag = as;
  return <Tag className={cn(tw.label, className)}>{children}</Tag>;
}

export function Input({ className = "", ...props }) {
  return <input className={cn(tw.input, className)} {...props} />;
}

export function Card({ children, className = "", as = "div" }) {
  const Tag = as;
  return <Tag className={cn(tw.card, className)}>{children}</Tag>;
}

export function PriorityBadge({ priority = "p2", className = "", map = false }) {
  return (
    <span className={cn(priorityBadgeClass(priority, { map }), className)}>
      {priorityLabel(priority)}
    </span>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: tw.btn,
    secondary: tw.btnOutline,
    sm: tw.btnSm,
    smOutline: tw.btnOutlineSm,
    ghost: "text-sm font-medium text-stone-600 hover:text-stone-900",
    danger:
      "inline-flex items-center justify-center rounded-lg border border-red-300 bg-surface px-5 py-2.5 text-sm font-medium text-red-700 transition-colors hover:border-red-500 hover:text-red-800",
  };

  return (
    <button type="button" className={cn(variants[variant] ?? tw.btn, className)} {...props}>
      {children}
    </button>
  );
}

export function MetaChip({ children, icon }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-line bg-accent-soft/40 px-2 py-0.5 text-xs font-medium text-stone-600">
      {icon ? <span className="text-stone-400">{icon}</span> : null}
      {children}
    </span>
  );
}

export function SectionHeader({ label, title, children }) {
  return (
    <header className="mb-6 border-b border-line/80 pb-5">
      {label ? <p className={tw.label}>{label}</p> : null}
      {title ? (
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-stone-900 md:text-xl">{title}</h1>
      ) : null}
      {children}
    </header>
  );
}

export { tw, cn, navLinkClass } from "../lib/tw.js";
