import { useEffect, useRef, useState } from "react";
import TypePin from "./TypePin.jsx";
import { Button } from "./ui.jsx";
import { tw, cn } from "../lib/tw.js";

export default function IdeaPanel({ idea, channels, onChange, onPromote, onDelete, onClose }) {
  const [draft, setDraft] = useState(null);
  const [channelId, setChannelId] = useState("");
  const timer = useRef(null);

  useEffect(() => {
    setDraft(idea ? { title: idea.title, notes: idea.notes || "" } : null);
    setChannelId(idea?.channel_id || "");
  }, [idea?.id, idea?.title, idea?.notes, idea?.channel_id]);

  const flush = (patch) => {
    if (!idea) return;
    onChange(patch);
  };

  const queueText = (field, value) => {
    setDraft((d) => (d ? { ...d, [field]: value } : d));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => flush({ [field]: value }), 450);
  };

  if (!idea) {
    return (
      <aside className="hidden border-l border-stone-200 bg-white p-8 lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="max-w-xs text-center">
          <p className={tw.label}>Brainstorm</p>
          <h2 className="mt-2 font-display text-2xl font-medium text-stone-900">Select an idea</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-500">
            Drag ideas around, connect them, and promote to a task when ready.
          </p>
        </div>
      </aside>
    );
  }

  const openChannels = channels.filter((c) => !c.archived);

  return (
    <aside className="max-h-[55vh] overflow-auto border-t border-stone-200 bg-white p-4 sm:p-6 lg:max-h-none lg:border-l lg:border-t-0 lg:p-8">
      <div className="mb-8 flex items-start justify-between gap-3 border-b border-stone-200 pb-6">
        <div className="flex gap-4">
          <TypePin type="idea" size="lg" showLabel />
          <h2 className="font-display text-3xl font-medium text-stone-900">{idea.title || "Untitled"}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="flex h-8 w-8 items-center justify-center text-stone-400 hover:text-stone-900"
        >
          ×
        </button>
      </div>

      <div className="space-y-5 border-b border-stone-200 pb-8">
        <div>
          <label htmlFor="idea-title" className={cn(tw.label, "mb-2 block")}>Title</label>
          <input
            id="idea-title"
            value={draft?.title ?? ""}
            onChange={(e) => queueText("title", e.target.value)}
            onBlur={() => flush({ title: draft?.title })}
            className={tw.input}
          />
        </div>
        <div>
          <label htmlFor="idea-notes" className={cn(tw.label, "mb-2 block")}>Notes</label>
          <textarea
            id="idea-notes"
            value={draft?.notes ?? ""}
            onChange={(e) => queueText("notes", e.target.value)}
            onBlur={() => flush({ notes: draft?.notes })}
            placeholder="Rough thoughts, links, sketches…"
            className={cn(tw.input, "min-h-[120px] resize-y")}
          />
        </div>
      </div>

      <div className="space-y-5 border-b border-stone-200 py-8">
        <p className={tw.label}>When it&apos;s real work</p>
        <div>
          <label htmlFor="promote-channel" className={cn(tw.label, "mb-2 block")}>Workstream</label>
          <select
            id="promote-channel"
            value={channelId}
            onChange={(e) => {
              setChannelId(e.target.value);
              flush({ channelId: e.target.value || null });
            }}
            className={tw.input}
          >
            <option value="">Unassigned</option>
            {openChannels.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <Button
          variant="primary"
          className="w-full"
          onClick={() => onPromote({ channelId: channelId || null })}
        >
          Promote to task
        </Button>
      </div>

      <div className="mt-8">
        <Button variant="danger" className="w-full" onClick={onDelete}>
          Delete idea
        </Button>
      </div>
    </aside>
  );
}
