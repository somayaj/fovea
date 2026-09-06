import { tw, cn } from "../lib/tw.js";

const TYPES = {
  task: {
    label: "Task",
    holderClass: "type-pin-holder-task",
  },
  idea: {
    label: "Idea",
    holderClass: "type-pin-holder-idea",
  },
};

function TypeIcon({ type }) {
  if (type === "idea") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="type-pin-icon">
        <path
          d="M12 3.5c-2.8 0-5 2.1-5 4.7 0 1.8 1 3.3 2.4 4.1V14h5.2v-1.7c1.4-.8 2.4-2.3 2.4-4.1 0-2.6-2.2-4.7-5-4.7z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M10 15.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10.75 18h2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M11.25 20h1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="type-pin-icon">
      <rect
        x="5.5"
        y="5.5"
        width="13"
        height="13"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8.5 12.25l2.2 2.2L15.5 9.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function typeMeta(type) {
  const key = type === "milestone" ? "task" : type;
  return TYPES[key] || TYPES.task;
}

export default function TypePin({ type = "task", size = "md", showLabel = false, className = "" }) {
  const meta = typeMeta(type);
  const iconType = type === "milestone" ? "task" : type;
  const sizeClass = size === "sm" ? "type-pin-sm" : size === "lg" ? "type-pin-lg" : "type-pin-md";

  return (
    <div
      className={`type-pin ${sizeClass} ${className}`}
      title={meta.label}
      aria-label={meta.label}
    >
      <div className={`type-pin-holder ${meta.holderClass}`}>
        <TypeIcon type={iconType} />
      </div>
      {showLabel ? <span className={cn("type-pin-label", tw.label)}>{meta.label}</span> : null}
    </div>
  );
}
