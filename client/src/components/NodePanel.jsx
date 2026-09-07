import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import TypePin from "./TypePin.jsx";
import TaskPhoto from "./TaskPhoto.jsx";
import WorkstreamPicker from "./WorkstreamPicker.jsx";
import PrioritySelect from "./PrioritySelect.jsx";
import { Button } from "./ui.jsx";
import { EmptyPanel } from "./PageHeader.jsx";
import { IconTrash, IconFocus } from "./icons.jsx";
import { FoveaMark } from "./FoveaLogo.jsx";
import { REPEAT_OPTIONS } from "../lib/recurrence.js";
import { tw, cn } from "../lib/tw.js";

const MAX_TASK_IMAGE_BYTES = 5 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024).toLocaleString()} KB`;
}

export default function NodePanel({
  node,
  projectId,
  channels,
  photoRole = "default",
  weekFocusId = null,
  weekFocusPinned = false,
  weekOffset = 0,
  onWeekFocusChange,
  onChange,
  onDelete,
  onSeriesDeleted,
  onClose,
}) {
  const [draft, setDraft] = useState(null);
  const [focusBusy, setFocusBusy] = useState(false);
  const [seriesBusy, setSeriesBusy] = useState(false);
  const [seriesInfo, setSeriesInfo] = useState(null);
  const [imageNotice, setImageNotice] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    setImageNotice(null);
  }, [node?.id]);

  useEffect(() => {
    setDraft(node ? { title: node.title, notes: node.notes || "" } : null);
  }, [node?.id, node?.title, node?.notes]);

  useEffect(() => {
    const seriesId = node?.recurrence_series_id;
    if (!seriesId) {
      setSeriesInfo(null);
      return;
    }
    let cancelled = false;
    api.getRecurrence(seriesId)
      .then((data) => {
        if (!cancelled) setSeriesInfo(data);
      })
      .catch(() => {
        if (!cancelled) setSeriesInfo(null);
      });
    return () => {
      cancelled = true;
    };
  }, [node?.recurrence_series_id]);

  const flush = (patch) => {
    if (!node) return;
    onChange(patch);
  };

  const queueText = (field, value) => {
    setDraft((d) => (d ? { ...d, [field]: value } : d));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => flush({ [field]: value }), 450);
  };

  const channelLabel = channels?.find((c) => c.id === node?.channel_id)?.name;

  const handleImageFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_TASK_IMAGE_BYTES) {
      setImageNotice({
        title: "Image is too large",
        message: `This file is ${formatFileSize(file.size)}. Choose an image under 5 MB, or paste an image URL below.`,
      });
      event.target.value = "";
      return;
    }
    setImageNotice(null);
    const reader = new FileReader();
    reader.onload = () => flush({ imageUrl: reader.result });
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const isWeekFocus = Boolean(node?.type === "task" && weekFocusId && node.id === weekFocusId);

  const handleSetWeekFocus = async () => {
    if (!node || node.type !== "task" || focusBusy) return;
    setFocusBusy(true);
    try {
      const data = await api.setWeekFocus(node.id, weekOffset);
      await onWeekFocusChange?.(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFocusBusy(false);
    }
  };

  const handleClearWeekFocus = async () => {
    if (focusBusy) return;
    setFocusBusy(true);
    try {
      const data = await api.clearWeekFocus(weekOffset);
      await onWeekFocusChange?.(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFocusBusy(false);
    }
  };

  const repeatLabel = seriesInfo?.series?.frequency
    ? REPEAT_OPTIONS.find((o) => o.value === seriesInfo.series.frequency)?.label
    : null;

  const handleDeleteSeries = async () => {
    const seriesId = node?.recurrence_series_id;
    if (!seriesId || seriesBusy) return;
    const count = seriesInfo?.instanceCount;
    const msg = count
      ? `Delete all ${count} tasks in this recurring series? This cannot be undone.`
      : "Delete all tasks in this recurring series? This cannot be undone.";
    if (!window.confirm(msg)) return;
    setSeriesBusy(true);
    try {
      await api.deleteRecurrence(seriesId);
      await onSeriesDeleted?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSeriesBusy(false);
    }
  };

  const editorBody = node ? (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-line/70 bg-paper px-5 py-4">
        <div className="flex min-w-0 gap-3">
          <TypePin type={node.type} size="md" className="shrink-0" />
          <div className="min-w-0">
            <p className={tw.label}>Editing</p>
            <h2 className="mt-0.5 truncate text-base font-semibold text-brand">
              {node.title || "Untitled"}
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
        <TaskPhoto
          task={node}
          channelName={channelLabel}
          photoRole={photoRole}
          size="lg"
          rotate={0}
          showTitle={false}
        />

        <div>
          <label htmlFor="imageUrl" className={cn(tw.label, "mb-1.5 block")}>Photo</label>
          <input
            id="imageUrl"
            type="url"
            value={node.image_url || ""}
            onChange={(e) => flush({ imageUrl: e.target.value || null })}
            placeholder="Paste an image URL…"
            className={tw.input}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <label className={cn(tw.btnSm, "cursor-pointer")}>
              Upload image
              <input type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
            </label>
            {node.image_url ? (
              <button
                type="button"
                className={tw.btnSm}
                onClick={() => flush({ imageUrl: null })}
              >
                Remove photo
              </button>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="title" className={cn(tw.label, "mb-1.5 block")}>Title</label>
          <input
            id="title"
            value={draft?.title ?? ""}
            onChange={(e) => queueText("title", e.target.value)}
            onBlur={() => flush({ title: draft?.title })}
            className={tw.input}
          />
        </div>
        <div>
          <label htmlFor="notes" className={cn(tw.label, "mb-1.5 block")}>Notes</label>
          <textarea
            id="notes"
            value={draft?.notes ?? ""}
            onChange={(e) => queueText("notes", e.target.value)}
            onBlur={() => flush({ notes: draft?.notes })}
            placeholder="Context, links, next steps…"
            className={cn(tw.input, "min-h-[100px] resize-y")}
          />
        </div>

        {node.type === "task" ? (
          <>
            <div>
              <label htmlFor="priority" className={cn(tw.label, "mb-1.5 block")}>Priority</label>
              <PrioritySelect
                id="priority"
                value={node.priority || "p2"}
                onChange={(e) => flush({ priority: e.target.value })}
                className="w-full min-w-0"
              />
            </div>
            <div>
              <label className={cn(tw.label, "mb-1.5 block")}>Workstream</label>
              {projectId ? (
                <WorkstreamPicker
                  projectId={projectId}
                  value={node.channel_id || ""}
                  selectedLabel={channelLabel}
                  onChange={(id) => flush({ channelId: id || null })}
                />
              ) : (
                <select
                  id="channel"
                  value={node.channel_id || ""}
                  onChange={(e) => flush({ channelId: e.target.value || null })}
                  className={tw.input}
                >
                  <option value="">Unassigned</option>
                  {(channels || []).filter((c) => !c.archived).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="hours" className={cn(tw.label, "mb-1.5 block")}>Hours</label>
                <input
                  id="hours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={node.estimate_hours ?? ""}
                  onChange={(e) =>
                    flush({ estimateHours: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  className={tw.input}
                />
              </div>
              <div>
                <label htmlFor="due" className={cn(tw.label, "mb-1.5 block")}>Due date</label>
                <input
                  id="due"
                  type="date"
                  value={node.due_at ? String(node.due_at).slice(0, 10) : ""}
                  onChange={(e) => flush({ dueAt: e.target.value || null })}
                  className={tw.input}
                />
              </div>
            </div>
            {node.recurrence_series_id ? (
              <div className="rounded-lg border border-line bg-accent-soft/40 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Recurring
                </p>
                <p className="mt-1 text-sm text-stone-800">
                  {repeatLabel || "Repeats"}
                  {seriesInfo?.instanceCount
                    ? ` · ${seriesInfo.instanceCount} task${seriesInfo.instanceCount === 1 ? "" : "s"}`
                    : ""}
                </p>
                <button
                  type="button"
                  disabled={seriesBusy}
                  onClick={handleDeleteSeries}
                  className={cn(tw.btnOutlineSm, "mt-2 w-full justify-center gap-1.5 text-red-800 border-red-200 hover:bg-red-50")}
                >
                  <IconTrash size={13} />
                  {seriesBusy ? "Deleting…" : "Delete all in series"}
                </button>
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              {isWeekFocus && weekFocusPinned ? (
                <button
                  type="button"
                  disabled={focusBusy}
                  onClick={handleClearWeekFocus}
                  className={cn(tw.btnOutlineSm, "w-full justify-center gap-1.5")}
                >
                  <IconFocus size={13} />
                  This week&apos;s focus — clear
                </button>
              ) : (
                <button
                  type="button"
                  disabled={focusBusy}
                  onClick={handleSetWeekFocus}
                  className={cn(tw.btnSm, "w-full justify-center gap-1.5")}
                >
                  <IconFocus size={13} />
                  {focusBusy ? "Updating…" : weekOffset === 0 ? "Make this week's focus" : "Make that week's focus"}
                </button>
              )}
            </div>
          </>
        ) : null}

        <Button variant="danger" className="w-full gap-2" onClick={onDelete}>
          <IconTrash size={14} />
          Delete
        </Button>
      </div>
    </>
  ) : (
    <EmptyPanel
      icon={<FoveaMark size={22} className="text-stone-400" />}
      title="Task details"
      description="Select a task to view and edit its details here."
    />
  );

  return (
    <div className="relative h-full min-h-0">
      {node ? (
        <div
          className="fixed inset-0 z-40 bg-stone-900/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      {/* Mobile bottom sheet */}
      {node ? (
        <aside className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-2xl border-t border-line/70 bg-surface shadow-md lg:hidden">
          <div className="max-h-[85vh] overflow-y-auto">
            {editorBody}
          </div>
        </aside>
      ) : null}

      {/* Desktop column — always one grid cell */}
      <aside className="relative hidden h-full min-h-0 overflow-hidden border-l border-line/70 bg-surface lg:block">
        <div className="h-full overflow-y-auto">
          {editorBody}
        </div>
      </aside>

      {imageNotice ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-900/35 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="image-notice-title"
          onClick={() => setImageNotice(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-line/80 bg-surface p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className={tw.label}>Photo</p>
            <h3 id="image-notice-title" className="mt-1 text-base font-semibold text-stone-900">
              {imageNotice.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{imageNotice.message}</p>
            <button
              type="button"
              onClick={() => setImageNotice(null)}
              className={cn(tw.btn, "mt-5 w-full")}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
