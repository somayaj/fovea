import { Handle, Position } from "@xyflow/react";
import { PriorityBadge } from "./ui.jsx";

const TYPE_META = {
  idea: { label: "Idea", color: "#78716c", bg: "bg-stone-100" },
  task: { label: "Task", color: "#c45f3e", bg: "bg-orange-50" },
  milestone: { label: "Milestone", color: "#8b5a6b", bg: "bg-violet-50" },
};

function BaseNode({ data, selected }) {
  const meta = TYPE_META[data.type] || TYPE_META.idea;
  const isFocus = data.isFocus;
  const isLinked = data.isLinked;

  return (
    <div
      className={[
        "map-node",
        data.type,
        selected ? "selected" : "",
        isFocus ? "map-node-focus" : "",
        isLinked ? "map-node-linked" : "",
      ].filter(Boolean).join(" ")}
    >
      <span className="node-accent" style={{ background: meta.color }} />
      <Handle type="target" position={Position.Left} className="node-handle" />

      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.bg} text-stone-600`}>
          {meta.label}
        </span>
        {data.priority ? <PriorityBadge priority={data.priority} /> : null}
      </div>

      <h3>{data.title}</h3>

      {isFocus ? (
        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
          Weekly focus
        </span>
      ) : null}

      {data.channelName ? (
        <span className="mt-2 inline-block text-xs text-stone-500">#{data.channelName}</span>
      ) : null}

      <Handle type="source" position={Position.Right} className="node-handle" />
    </div>
  );
}

export const nodeTypes = {
  idea: BaseNode,
  task: BaseNode,
  milestone: BaseNode,
};
