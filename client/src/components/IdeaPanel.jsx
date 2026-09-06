import { useEffect, useRef, useState } from "react";
import TypePin from "./TypePin.jsx";
import { Button } from "./ui.jsx";
import { EmptyPanel } from "./PageHeader.jsx";
import { FoveaMark } from "./FoveaLogo.jsx";
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

  const openChannels = channels.filter((c) => !c.archived);

  const editorBody = idea ? (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-line/70 bg-paper px-5 py-4">
        <div className="flex min-w-0 gap-3">
          <TypePin type="idea" size="md" className="shrink-0" />
          <div className="min-w-0">
            <p className={tw.label}>Editing</p>
            <h2 className="mt-0.5 truncate text-base font-semibold text-brand">
              {idea.title || "Untitled"}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-accent-soft/50 hover:text-brand"
        >
          ×
        </button>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div>
          <label htmlFor="idea-title" className={cn(tw.label, "mb-1.5 block")}>Title</label>
          <input
            id="idea-title"
            value={draft?.title ?? ""}
            onChange={(e) => queueText("title", e.target.value)}
            onBlur={() => flush({ title: draft?.title })}
            className={tw.input}
          />
        </div>
        <div>
          <label htmlFor="idea-notes" className={cn(tw.label, "mb-1.5 block")}>Notes</label>
          <textarea
            id="idea-notes"
            value={draft?.notes ?? ""}
            onChange={(e) => queueText("notes", e.target.value)}
            onBlur={() => flush({ notes: draft?.notes })}
            placeholder="Rough thoughts, links, sketches…"
            className={cn(tw.input, "min-h-[100px] resize-y")}
          />
        </div>

        <div className="border-t border-line pt-4">
          <p className={tw.label}>When it&apos;s real work</p>
          <div className="mt-3">
            <label htmlFor="promote-channel" className={cn(tw.label, "mb-1.5 block")}>Workstream</label>
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
            className="mt-3 w-full"
            onClick={() => onPromote({ channelId: channelId || null })}
          >
            Promote to task
          </Button>
        </div>

        <Button variant="danger" className="w-full" onClick={onDelete}>
          Delete idea
        </Button>
      </div>
    </>
  ) : (
    <EmptyPanel
      icon={<FoveaMark size={22} className="text-stone-400" />}
      title="Idea details"
      description="Select an idea to view and edit it here."
    />
  );

  return (
    <div className="relative h-full min-h-0">
      {idea ? (
        <div
          className="fixed inset-0 z-40 bg-stone-900/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      {idea ? (
        <aside className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-2xl border-t border-line/70 bg-surface shadow-md lg:hidden">
          <div className="max-h-[85vh] overflow-y-auto">
            {editorBody}
          </div>
        </aside>
      ) : null}

      <aside className="relative hidden h-full min-h-0 overflow-hidden border-l border-line/70 bg-surface lg:block">
        <div className="h-full overflow-y-auto">
          {editorBody}
        </div>
      </aside>
    </div>
  );
}
