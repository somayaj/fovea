import { useEffect, useState } from "react";
import WorkstreamPicker from "./WorkstreamPicker.jsx";
import PrioritySelect from "./PrioritySelect.jsx";
import { defaultRepeatUntil, REPEAT_OPTIONS } from "../lib/recurrence.js";
import { tw, cn } from "../lib/tw.js";

export default function TaskComposer({
  projectId,
  channels,
  defaultChannelId = "",
  lockChannel = false,
  placeholder = "What needs to get done?",
  onSubmit,
  compact = false,
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("p2");
  const [channelId, setChannelId] = useState(defaultChannelId);
  const [dueAt, setDueAt] = useState("");
  const [repeat, setRepeat] = useState("");
  const [repeatUntil, setRepeatUntil] = useState(() => defaultRepeatUntil());
  const [estimateHours, setEstimateHours] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setChannelId(defaultChannelId);
  }, [defaultChannelId]);

  useEffect(() => {
    if (repeat && dueAt) {
      setRepeatUntil(defaultRepeatUntil(new Date(`${dueAt}T12:00:00`)));
    }
  }, [dueAt, repeat]);

  const openChannels = channels?.filter((c) => !c.archived) ?? [];

  const submit = async (event) => {
    event.preventDefault();
    if (!title.trim() || busy) return;
    if (repeat && !repeatUntil) return;
    setBusy(true);
    try {
      await onSubmit({
        title: title.trim(),
        priority,
        channelId: lockChannel ? defaultChannelId : channelId || null,
        dueAt: dueAt || null,
        estimateHours: estimateHours === "" ? null : Number(estimateHours),
        recurrence: repeat
          ? { frequency: repeat, endDate: repeatUntil }
          : null,
      });
      setTitle("");
      setPriority("p2");
      setDueAt("");
      setRepeat("");
      setRepeatUntil(defaultRepeatUntil());
      setEstimateHours("");
      if (!lockChannel) setChannelId(defaultChannelId);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        "border border-line/80 bg-[#fdfbf7] p-4",
        compact ? "" : "shadow-sm",
      )}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        aria-label="Task title"
        className={tw.input}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PrioritySelect
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        />
        {!lockChannel && projectId ? (
          <WorkstreamPicker
            projectId={projectId}
            value={channelId}
            selectedLabel={openChannels.find((c) => c.id === channelId)?.name}
            onChange={setChannelId}
          />
        ) : !lockChannel ? (
          <select
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            aria-label="Workstream"
            className={cn(tw.input, "w-auto min-w-[140px]")}
          >
            <option value="">No workstream</option>
            {openChannels.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        ) : null}
        <input
          type="date"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          aria-label="First due date"
          className={cn(tw.input, "w-auto")}
        />
        <select
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          aria-label="Repeat"
          className={cn(tw.input, "w-auto min-w-[140px]")}
        >
          {REPEAT_OPTIONS.map((o) => (
            <option key={o.value || "none"} value={o.value}>{o.label}</option>
          ))}
        </select>
        {repeat ? (
          <input
            type="date"
            value={repeatUntil}
            min={dueAt || undefined}
            onChange={(e) => setRepeatUntil(e.target.value)}
            aria-label="Repeat until"
            className={cn(tw.input, "w-auto")}
          />
        ) : null}
        <input
          type="number"
          min="0"
          step="0.5"
          value={estimateHours}
          onChange={(e) => setEstimateHours(e.target.value)}
          placeholder="Hours"
          aria-label="Estimated hours"
          className={cn(tw.input, "w-24")}
        />
        <button
          type="submit"
          disabled={busy || !title.trim() || (repeat && !repeatUntil)}
          className={cn(tw.btnSm, "ml-auto disabled:opacity-50")}
        >
          {repeat ? "Add series" : "Add task"}
        </button>
      </div>
      {repeat ? (
        <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
          Creates one task per occurrence from the first due date through the end date.
        </p>
      ) : null}
    </form>
  );
}
