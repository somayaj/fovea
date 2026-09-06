import { Handle, Position } from "@xyflow/react";
import TaskPhoto from "./TaskPhoto.jsx";
import { cn } from "../lib/tw.js";

const HANDLE = "!h-2 !w-2 !border-0 !bg-stone-400 !opacity-0 group-hover:!opacity-100";

function ideaCaption(idea) {
  const title = idea.title?.trim();
  const notes = idea.notes?.trim();
  if (title && title !== "New idea") return title;
  if (notes) return notes;
  return title || "New idea";
}

function ideaMeta(idea) {
  const title = idea.title?.trim();
  const notes = idea.notes?.trim();
  if (notes && title && title !== "New idea" && notes !== title) return notes;
  return null;
}

function IdeaNode({ data, selected }) {
  const caption = ideaCaption(data);
  const meta = ideaMeta(data);

  return (
    <div className="group flex flex-col items-center">
      <Handle type="source" position={Position.Top} className={HANDLE} id="st" />
      <Handle type="source" position={Position.Right} className={HANDLE} id="sr" />
      <Handle type="source" position={Position.Bottom} className={HANDLE} id="sb" />
      <Handle type="source" position={Position.Left} className={HANDLE} id="sl" />
      <Handle type="target" position={Position.Top} className={HANDLE} id="tt" />
      <Handle type="target" position={Position.Right} className={HANDLE} id="tr" />
      <Handle type="target" position={Position.Bottom} className={HANDLE} id="tb" />
      <Handle type="target" position={Position.Left} className={HANDLE} id="tl" />
      <TaskPhoto
        task={{ id: data.id, title: data.title, type: "idea", notes: data.notes }}
        caption={caption}
        meta={meta}
        size="sm"
        showImage={true}
        rotate={0}
        selected={selected}
        className={cn(
          "brainstorm-idea-polaroid sketch-map-polaroid",
          selected && "ring-2 ring-accent/40",
        )}
      />
    </div>
  );
}

export const brainstormNodeTypes = { idea: IdeaNode };

export function brainstormNodeFromIdea(idea, selectedId) {
  return {
    id: idea.id,
    type: "idea",
    position: { x: idea.x ?? 0, y: idea.y ?? 0 },
    data: { ...idea, title: idea.title, notes: idea.notes },
    selected: idea.id === selectedId,
    zIndex: idea.id === selectedId ? 20 : 10,
  };
}
