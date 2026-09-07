import { PRIORITY_LEVELS, prioritySelectClass } from "../lib/priority.js";
import { tw, cn } from "../lib/tw.js";

export default function PrioritySelect({
  value = "p2",
  onChange,
  id,
  className = "",
  showCode = false,
  "aria-label": ariaLabel = "Priority",
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      className={cn(tw.input, prioritySelectClass(value), "w-auto min-w-[148px] font-medium", className)}
    >
      {PRIORITY_LEVELS.map((level) => (
        <option key={level.value} value={level.value}>
          {showCode ? `${level.code} — ${level.label}` : level.label}
        </option>
      ))}
    </select>
  );
}
