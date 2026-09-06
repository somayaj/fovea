import { cn } from "../lib/tw.js";

const WORDMARK = "font-display font-semibold leading-none tracking-tight";
const SUBTITLE_SCRIPT = "photo-note-caption";

const SIZES = {
  xs: { mark: 16, box: "h-6 w-6 rounded-md", text: "text-sm", subtitle: "text-xs", subtitleScript: "text-lg", gap: "gap-1.5" },
  sm: { mark: 20, box: "h-7 w-7 rounded-lg", text: "text-base", subtitle: "text-sm", subtitleScript: "text-xl", gap: "gap-2" },
  md: { mark: 28, box: "h-9 w-9 rounded-lg", text: "text-lg", subtitle: "text-base", subtitleScript: "text-2xl", gap: "gap-2.5" },
  lg: { mark: 40, box: "h-12 w-12 rounded-xl", text: "text-2xl", subtitle: "text-lg", subtitleScript: "text-2xl", gap: "gap-3" },
  xl: { mark: 52, box: "h-14 w-14 rounded-xl", text: "text-3xl", subtitle: "text-xl", subtitleScript: "text-[1.75rem]", gap: "gap-4" },
};

/** Aperture / focal-point mark — the “fovea” of the eye. */
export function FoveaMark({ size = 24, className = "" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.25" opacity="0.22" />
      <circle cx="16" cy="16" r="8.5" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
      <circle cx="16" cy="16" r="3.25" fill="currentColor" />
      <path
        d="M16 4v2.5M16 25.5V28M4 16h2.5M25.5 16H28"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

export default function FoveaLogo({
  size = "sm",
  showWordmark = true,
  subtitle,
  subtitleProminent = false,
  layout = "inline",
  inverted = false,
  className = "",
}) {
  const s = SIZES[size] || SIZES.sm;
  const isBrand = layout === "brand";

  const mark = (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        s.box,
        inverted ? "bg-white/15 text-white" : "bg-accent/10 text-accent",
      )}
    >
      <FoveaMark size={s.mark} />
    </div>
  );

  const wordmark = showWordmark ? (
    <p className={cn(WORDMARK, s.text, inverted ? "text-white" : "text-stone-900")}>
      Fovea
    </p>
  ) : null;

  const subtitleEl = subtitle ? (
    <p
      className={cn(
        subtitleProminent ? SUBTITLE_SCRIPT : WORDMARK,
        subtitleProminent
          ? cn(
              isBrand ? "login-hero-brand-tagline mt-2.5" : cn("mt-1 text-left", s.subtitleScript),
            )
          : "mt-0.5 truncate text-[11px]",
        inverted
          ? subtitleProminent
            ? "text-white"
            : "text-white/70"
          : subtitleProminent
            ? "text-stone-900"
            : "text-stone-500",
      )}
    >
      {subtitle}
    </p>
  ) : null;

  if (isBrand) {
    return (
      <div className={cn("min-w-0", className)}>
        <div className={cn("flex min-w-0 items-center", s.gap)}>
          {mark}
          {wordmark}
        </div>
        {subtitleEl}
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center", s.gap, className)}>
      {mark}
      {showWordmark ? (
        <div className="min-w-0">
          {wordmark}
          {subtitleEl}
        </div>
      ) : null}
    </div>
  );
}
