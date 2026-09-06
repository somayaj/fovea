import { Link } from "react-router-dom";
import { tw, cn } from "../lib/tw.js";

export function PageHeader({ icon, eyebrow, title, description, actions, toolbar, className = "" }) {
  return (
    <header
      className={cn(
        "relative z-20 shrink-0 overflow-visible border-b border-line/70 bg-[#fdfbf7]/90 px-5 py-4 backdrop-blur-md md:px-6",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <div className="flex items-center gap-2">
              {icon ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent">
                  {icon}
                </span>
              ) : null}
              <p className={tw.label}>{eyebrow}</p>
            </div>
          ) : null}
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-stone-900 md:text-xl">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-stone-500">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {toolbar ? <div className="relative z-20 mt-4 overflow-visible">{toolbar}</div> : null}
    </header>
  );
}

export function StatPill({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-white px-4 py-3 shadow-sm">
      {icon ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <p className={tw.label}>{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-stone-800">{value}</p>
      </div>
    </div>
  );
}

export function ActionLink({ to, icon, children, className = "" }) {
  return (
    <Link to={to} className={cn(tw.btnOutlineSm, className)}>
      {icon}
      {children}
    </Link>
  );
}

export function SegmentedControl({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-lg border border-line/80 bg-white/60 p-0.5 backdrop-blur-sm">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(tw.segment, active ? tw.segmentActive : tw.segmentIdle)}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyPanel({ icon, title, description, action }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
          {icon}
        </div>
      ) : null}
      <p className={tw.label}>{title}</p>
      {description ? <p className="mt-2 max-w-xs text-sm text-stone-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
