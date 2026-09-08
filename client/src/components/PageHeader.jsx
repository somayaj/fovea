import { Link } from "react-router-dom";
import { PageChromeProvider, usePageChrome } from "../context/PageChromeContext.jsx";
import { chrome, headerChrome } from "../lib/chrome.js";
import { useDarkChrome } from "../lib/useDarkChrome.js";
import { tw, cn } from "../lib/tw.js";

export function PageHeader({ icon, eyebrow, title, description, actions, toolbar, className = "" }) {
  const dark = useDarkChrome();

  return (
    <PageChromeProvider>
      <header
        className={cn(
          "page-header app-chrome-bar relative z-20 flex shrink-0 flex-col justify-center overflow-visible px-5 py-3.5 md:px-6",
          headerChrome.bar,
          dark && "page-header--dark",
          className,
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <div className="flex items-center gap-2">
                {icon ? (
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-md",
                      dark ? headerChrome.accentBg : "bg-accent/10 text-accent",
                    )}
                  >
                    {icon}
                  </span>
                ) : null}
                <p className={dark ? cn("text-[11px] font-medium", headerChrome.muted) : tw.label}>{eyebrow}</p>
              </div>
            ) : null}
            <h1 className={cn("page-header-title", dark && "page-header-title--chrome")}>{title}</h1>
          </div>
          {actions ? (
            <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">{actions}</div>
          ) : null}
        </div>
        {description ? (
          <p
            className={cn(
              "mt-2 hidden text-sm leading-relaxed sm:block",
              dark ? headerChrome.muted : "text-muted",
            )}
          >
            {description}
          </p>
        ) : null}
        {toolbar ? (
          <div className="page-header-toolbar relative z-20 mt-4 overflow-visible">{toolbar}</div>
        ) : null}
      </header>
    </PageChromeProvider>
  );
}

export function StatPill({ icon, label, value }) {
  const { dark } = usePageChrome();

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3",
        dark ? cn("border", headerChrome.border, headerChrome.surface) : "border-line/80 bg-surface",
      )}
    >
      {icon ? (
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            dark ? "bg-header-hover text-header-muted" : "bg-stone-100 text-stone-500",
          )}
        >
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <p className={dark ? cn("text-[11px] font-medium", headerChrome.muted) : tw.label}>{label}</p>
        <p className={cn("mt-0.5 truncate text-sm font-medium", dark ? "text-header-text" : "text-stone-800")}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function ActionLink({ to, icon, children, className = "" }) {
  const { dark } = usePageChrome();

  return (
    <Link
      to={to}
      className={cn(
        dark ? headerChrome.control : tw.btnOutlineSm,
        className,
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

export function HeaderButton({ className = "", children, ...props }) {
  const { dark } = usePageChrome();

  return (
    <button
      type="button"
      className={cn(dark ? headerChrome.btnSm : tw.btnSm, className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function HeaderOutlineButton({ className = "", children, ...props }) {
  const { dark } = usePageChrome();

  return (
    <button
      type="button"
      className={cn(dark ? headerChrome.control : tw.btnOutlineSm, className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function SegmentedControl({ value, onChange, options }) {
  const { dark } = usePageChrome();

  return (
    <div
      className={cn(
        "inline-flex rounded-lg border p-0.5",
        dark ? cn(headerChrome.border, headerChrome.surface) : "border-line/80 bg-accent-soft/45",
      )}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              tw.segment,
              active
                ? dark
                  ? "bg-header-hover text-header-text"
                  : tw.segmentActive
                : dark
                  ? cn(headerChrome.muted, "hover:text-header-text")
                  : tw.segmentIdle,
            )}
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
      {description ? <p className="mt-2 max-w-xs text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
