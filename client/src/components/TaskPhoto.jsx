import InstantPhoto from "./InstantPhoto.jsx";
import { taskPhotoAlt, taskPhotoUrl } from "../lib/taskPhoto.js";
import { cn } from "../lib/tw.js";

/**
 * Task shown as an instant photo — image describes the task, title on the frame.
 */
export default function TaskPhoto({
  task,
  channelName,
  photoRole = "default",
  size = "sm",
  rotate = 0,
  caption,
  label,
  showTitle = true,
  showImage = true,
  meta,
  selected = false,
  onClick,
  className = "",
  imageClassName = "",
  children,
}) {
  const src = taskPhotoUrl(task, { role: photoRole });
  const title = task?.title || "Untitled";
  const frameCaption = caption ?? (showTitle ? title : undefined);

  const photo = (
    <InstantPhoto
      size={size}
      rotate={rotate}
      caption={frameCaption}
      label={label}
      meta={meta}
      className={cn(
        selected && "task-photo-selected",
        onClick && "transition-transform hover:scale-[1.02]",
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={taskPhotoAlt(task)}
          className={cn(
            "task-photo-img",
            className?.includes("sketch-map-polaroid")
              ? "task-photo-map-img"
              : "block w-full aspect-[4/3] object-cover",
            imageClassName,
          )}
        />
      ) : null}
      {children}
    </InstantPhoto>
  );

  if (!onClick) return photo;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open task: ${title}`}
      aria-pressed={selected}
      className={cn(
        "block w-full cursor-pointer rounded-sm border-0 bg-transparent p-0 text-left",
        selected && "scale-[1.02]",
      )}
    >
      {photo}
    </button>
  );
}

/** Compact photo strip for map cards and list rows (no polaroid frame). */
export function TaskPhotoThumb({ task, channelName, className = "" }) {
  return (
    <div className={cn("task-image overflow-hidden", className)}>
      <img
        src={taskPhotoUrl(task)}
        alt={taskPhotoAlt(task)}
        className="task-photo-img h-full w-full object-cover"
      />
    </div>
  );
}
