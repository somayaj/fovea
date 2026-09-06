import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import TaskComposer from "../components/TaskComposer.jsx";
import TypePin from "../components/TypePin.jsx";
import { workstreamTheme } from "../lib/content.js";
import { PriorityBadge } from "../components/ui.jsx";
import PrioritySelect from "../components/PrioritySelect.jsx";
import { useChannels } from "../context/ChannelsContext.jsx";
import { tw, cn } from "../lib/tw.js";

const PAGE_SIZE = 50;
const PRIORITY_ORDER = { p0: 0, p1: 1, p2: 2, p3: 3 };

export default function ChannelView({ me }) {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { channels, refresh: refreshChannels } = useChannels();
  const projectId = me.project?.id;
  const channel = channels.find((c) => c.id === channelId);

  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const loadMoreRef = useRef(null);

  const load = useCallback(
    async ({ append = false, offset = 0 } = {}) => {
      if (!projectId || !channelId) return;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const data = await api.tasks(projectId, {
          channel: channelId,
          limit: PAGE_SIZE,
          offset,
        });
        const next = data.nodes || [];
        setTasks((prev) => (append ? [...prev, ...next] : next));
        setTotal(data.total || 0);
        setHasMore(Boolean(data.hasMore));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [projectId, channelId],
  );

  useEffect(() => {
    load({ append: false, offset: 0 }).catch(console.error);
  }, [load]);

  const tasksLengthRef = useRef(0);
  useEffect(() => {
    tasksLengthRef.current = tasks.length;
  }, [tasks.length]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          load({ append: true, offset: tasksLengthRef.current }).catch(console.error);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, load]);

  useEffect(() => {
    if (!loading && channels.length && !channel) {
      navigate("/map", { replace: true });
    }
  }, [channel, channels, loading, navigate]);

  const addTask = async ({ title, priority, channelId: cid, dueAt, estimateHours, recurrence }) => {
    await api.createNode({
      projectId,
      type: "task",
      title,
      priority,
      channelId: cid || channelId,
      dueAt: dueAt || null,
      estimateHours,
      recurrence,
      x: 120 + Math.random() * 200,
      y: 120 + Math.random() * 200,
    });
    await load({ append: false });
    await refreshChannels();
  };

  const updateTask = async (taskId, body) => {
    await api.patchNode(taskId, body);
    await load({ append: false });
    await refreshChannels();
  };

  const deleteTask = async (taskId) => {
    await api.deleteNode(taskId);
    await load({ append: false });
    await refreshChannels();
  };

  if (!channel) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className={tw.label}>Loading</span>
      </div>
    );
  }

  const theme = workstreamTheme(channel.name);
  const selectClass = cn(tw.input, "w-auto min-w-[100px] py-1.5 text-xs");
  const sorted = [...tasks].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9),
  );

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <header className="border-b border-line bg-surface px-8 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={tw.label}>Workstream</p>
            <h1 className="mt-2 font-display text-4xl font-medium text-stone-900">{channel.name}</h1>
            <p className="mt-2 text-sm text-stone-500">
              {theme.tagline} · {total.toLocaleString()} task{total === 1 ? "" : "s"}
            </p>
          </div>
          <Link to={`/map?channel=${channelId}`} className={tw.btnOutline}>
            Open map
          </Link>
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-auto px-8 py-8">
        <TaskComposer
          projectId={projectId}
          channels={channels}
          defaultChannelId={channelId}
          lockChannel
          placeholder={`Add a task to #${channel.name}…`}
          onSubmit={addTask}
        />

        {loading ? (
          <p className={tw.label}>Loading tasks</p>
        ) : sorted.length === 0 ? (
          <div className={tw.empty}>
            <p className="font-display text-2xl font-medium text-stone-900">Nothing here yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-500">
              Add a task above, or sketch one on the map.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sorted.map((task) => (
              <li key={task.id} className={cn(tw.card, "p-5")}>
                <div className="flex gap-4">
                  <TypePin type={task.type} size="sm" className="shrink-0 pt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      {editingId === task.id ? (
                        <input
                          className={cn(tw.input, "flex-1 text-sm")}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              await updateTask(task.id, { title: editTitle });
                              setEditingId(null);
                            }
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <h2 className="font-display text-xl font-medium text-stone-900">{task.title}</h2>
                      )}
                      <PriorityBadge priority={task.priority} />
                    </div>
                    {task.notes ? (
                      <p className="mt-2 text-sm leading-relaxed text-stone-500">{task.notes}</p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
                      <PrioritySelect
                        value={task.priority || "p2"}
                        onChange={(e) => updateTask(task.id, { priority: e.target.value })}
                        aria-label="Change priority"
                        className={cn(selectClass, "min-w-[120px]")}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(task.id);
                          setEditTitle(task.title);
                        }}
                        className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500 hover:text-stone-900"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        className="text-[11px] font-semibold uppercase tracking-[0.12em] text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {hasMore ? (
          <div ref={loadMoreRef} className="py-4 text-center text-sm text-stone-500">
            {loadingMore ? "Loading more tasks…" : ""}
          </div>
        ) : null}
      </div>
    </div>
  );
}
