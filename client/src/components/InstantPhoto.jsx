import { cn } from "../lib/tw.js";

/** Polaroid-style frame for tasks and focus cards. */
export default function InstantPhoto({
  children,
  className = "",
  size = "sm",
  rotate = 0,
  caption,
  label,
  meta,
}) {
  return (
    <div
      className={cn("instant-photo", size === "lg" && "instant-photo-lg", className)}
      style={{ "--instant-rotate": `${rotate}deg` }}
    >
      {children ? <div className="instant-photo-well">{children}</div> : null}
      {caption || label || meta ? (
        <div className="instant-photo-caption">
          {label ? <span className="instant-photo-label">{label}</span> : null}
          {caption ? <span className="instant-photo-title">{caption}</span> : null}
          {meta ? <span className="instant-photo-meta">{meta}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
