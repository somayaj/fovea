import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import { useChannels } from "../context/ChannelsContext.jsx";
import { workstreamColor } from "../lib/foveaTheme.js";
import { chrome } from "../lib/chrome.js";
import { cn, tw } from "../lib/tw.js";
import {
  IconBrainstorm,
  IconEdit,
  IconFocus,
  IconList,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUsers,
} from "./icons.jsx";
import SidebarHoverLabel from "./SidebarHoverLabel.jsx";

const VISIBLE_WORKSTREAMS = 10;

const NAV = [
  { to: "/", end: true, label: "Focus", icon: IconFocus, hint: "This week" },
  {
    to: "/map",
    end: true,
    label: "Tasks",
    icon: IconList,
    hint: "All workstreams",
    matchActive: (_, location) =>
      location.pathname === "/map" && !new URLSearchParams(location.search).get("channel"),
    onNavigate: () => window.dispatchEvent(new CustomEvent("fovea:reset-map")),
  },
  { to: "/brainstorm", label: "Brainstorm", icon: IconBrainstorm, hint: "Ideas" },
];

function SectionLabel({ children, action }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2 px-2">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-sidebar-muted">{children}</span>
      {action}
    </div>
  );
}

function NavItem({ item, location, collapsed }) {
  const Icon = item.icon;
  const customActive = item.matchActive ? item.matchActive(null, location) : undefined;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={() => item.onNavigate?.()}
      className={({ isActive }) => {
        const on = customActive !== undefined ? customActive : isActive;
        return cn(
          "group relative flex items-center rounded-lg py-1.5 text-[12px] font-medium transition-all",
          collapsed ? "justify-center px-1.5" : "gap-2 px-2",
          on
            ? cn(chrome.navActive, "ring-1 ring-sidebar-border/60")
            : chrome.navIdle,
        );
      }}
    >
      {({ isActive }) => {
        const on = customActive !== undefined ? customActive : isActive;
        return (
          <>
            {on && !collapsed ? (
              <span
                className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-accent"
                aria-hidden="true"
              />
            ) : null}
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                on ? chrome.accentBg : cn(chrome.muted, "group-hover:text-sidebar-text"),
              )}
            >
              <Icon size={14} />
            </span>
            {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
            {collapsed ? <SidebarHoverLabel label={item.label} meta={item.hint} /> : null}
          </>
        );
      }}
    </NavLink>
  );
}

function WorkstreamRow({ channel, index, isActive, onRename, onArchive, collapsed }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(channel.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const dot = workstreamColor(channel.name, index);

  useEffect(() => {
    if (!editing) setDraft(channel.name);
  }, [channel.name, editing]);

  const saveRename = async (event) => {
    event.preventDefault();
    const next = draft.trim();
    if (!next || next === channel.name) {
      setEditing(false);
      setDraft(channel.name);
      return;
    }
    setBusy(true);
    try {
      await onRename(channel.id, next);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const confirmArchive = async () => {
    setBusy(true);
    try {
      await onArchive(channel.id);
      setConfirmDelete(false);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <form onSubmit={saveRename} className="mb-1 space-y-2 rounded-lg border border-sidebar-border bg-sidebar-surface p-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          disabled={busy}
          className="w-full rounded-md border border-sidebar-border bg-sidebar-hover px-2.5 py-1.5 text-xs text-sidebar-text focus:border-sidebar-accent/40 focus:outline-none focus:ring-2 focus:ring-sidebar-accent/10"
        />
        <div className="flex gap-1.5">
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="flex-1 rounded-md bg-accent py-1.5 text-[11px] font-medium text-white disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setEditing(false);
              setDraft(channel.name);
            }}
            className="flex-1 rounded-md border border-sidebar-border py-1.5 text-[11px] font-medium text-sidebar-muted hover:bg-sidebar-hover"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (confirmDelete) {
    return (
      <div className="mb-1 overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-surface p-3 ring-1 ring-sidebar-accent/10">
        <div className="flex items-start gap-2.5">
          <span
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: `${dot}22` }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            {!collapsed ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-accent">
                  Remove workstream
                </p>
                <p className="mt-1 text-sm font-medium text-sidebar-text">{channel.name}</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-sidebar-muted">
                  {channel.tasks > 0
                    ? `${channel.tasks} task${channel.tasks === 1 ? "" : "s"} in this workstream will be removed.`
                    : "This workstream will be removed."}
                </p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-medium text-sidebar-text">Remove {channel.name}?</p>
                <p className="mt-1 text-[10px] leading-relaxed text-sidebar-muted">
                  {channel.tasks > 0 ? `${channel.tasks} tasks removed.` : "Workstream removed."}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmDelete(false)}
            className={cn(tw.btnOutlineSm, "flex-1")}
          >
            Keep
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={confirmArchive}
            className="flex-1 rounded-md border border-red-200/90 bg-sidebar-surface px-2.5 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-50/60 disabled:opacity-50"
          >
            {busy ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group mb-0.5 flex items-center gap-0.5 rounded-lg transition-colors",
        isActive ? cn(chrome.navActive, "ring-1 ring-sidebar-border/60") : "hover:bg-sidebar-hover/80",
        collapsed && "justify-center",
      )}
    >
      <Link
        to={`/map?channel=${channel.id}`}
        className={cn(
          "group/link relative flex min-w-0 items-center gap-1.5 rounded-lg py-1.5 text-[12px]",
          collapsed ? "justify-center px-1.5" : "flex-1 px-2",
          isActive ? cn("font-medium", chrome.accent) : chrome.muted,
        )}
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${dot}22` }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot }} aria-hidden="true" />
        </span>
        {!collapsed ? (
          <>
            <span className="min-w-0 flex-1 truncate">{channel.name}</span>
            {channel.tasks > 0 ? (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium tabular-nums",
                  isActive ? "bg-sidebar-accent/12 text-sidebar-accent" : "bg-sidebar-hover text-sidebar-muted",
                )}
              >
                {channel.tasks}
              </span>
            ) : null}
          </>
        ) : null}
        {collapsed ? (
          <SidebarHoverLabel
            label={channel.name}
            meta={channel.tasks > 0 ? `${channel.tasks} tasks` : null}
          />
        ) : null}
      </Link>
      {!collapsed ? (
      <div className="flex shrink-0 items-center pr-0.5 opacity-70 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          aria-label={`Rename ${channel.name}`}
          onClick={() => setEditing(true)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
        >
          <IconEdit size={12} />
        </button>
        <button
          type="button"
          aria-label={`Delete ${channel.name}`}
          onClick={() => setConfirmDelete(true)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
        >
          <IconTrash size={12} />
        </button>
      </div>
      ) : null}
    </div>
  );
}

export default function ChannelSidebar({ collapsed = false, onRequestExpand, isAdmin = false }) {
  const {
    channels,
    total,
    hasMore,
    search,
    loading,
    loadingMore,
    createChannel,
    updateChannel,
    archiveChannel,
    searchChannels,
    loadMore,
  } = useChannels();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const activeChannelId = location.pathname === "/map" ? searchParams.get("channel") : null;
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [query, setQuery] = useState(search);
  const [pinnedChannel, setPinnedChannel] = useState(null);
  const trimmedQuery = query.trim();
  const searching = Boolean(trimmedQuery);

  useEffect(() => {
    setQuery(search);
  }, [search]);

  useEffect(() => {
    if (!activeChannelId || searching) {
      setPinnedChannel(null);
      return;
    }
    if (channels.some((channel) => channel.id === activeChannelId)) {
      setPinnedChannel(null);
      return;
    }
    api
      .channel(activeChannelId)
      .then(({ channel }) => setPinnedChannel(channel))
      .catch(() => setPinnedChannel(null));
  }, [activeChannelId, channels, searching]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== search) searchChannels(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, search, searchChannels]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    await createChannel(name.trim());
    setName("");
    setAdding(false);
  };

  const handleRename = async (channelId, nextName) => {
    await updateChannel(channelId, { name: nextName });
  };

  const handleArchive = async (channelId) => {
    await archiveChannel(channelId);
    if (activeChannelId === channelId) {
      navigate("/map", { replace: true });
    }
  };

  const showEmpty = !loading && channels.length === 0;

  const visibleChannels = (() => {
    if (searching) return channels;
    const active =
      channels.find((channel) => channel.id === activeChannelId) ||
      (pinnedChannel?.id === activeChannelId ? pinnedChannel : null);
    const top = channels.slice(0, VISIBLE_WORKSTREAMS);
    if (active && !top.some((channel) => channel.id === activeChannelId)) {
      return [...top.slice(0, VISIBLE_WORKSTREAMS - 1), active];
    }
    return top;
  })();

  const hiddenWorkstreamCount = Math.max(0, total - VISIBLE_WORKSTREAMS);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", collapsed ? "overflow-visible" : "overflow-hidden")}>
      <div className={cn("shrink-0 pb-1.5 pt-2.5", collapsed ? "px-1.5" : "px-3")}>
        {!collapsed ? <SectionLabel>Navigate</SectionLabel> : null}
        <nav className="space-y-0.5">
          {[
            ...NAV,
            ...(isAdmin
              ? [{ to: "/admin", label: "Admin", icon: IconUsers, hint: "Signed-in users" }]
              : []),
          ].map((item) => (
            <NavItem key={item.label} item={item} location={location} collapsed={collapsed} />
          ))}
        </nav>
      </div>

      {!collapsed ? <div className="mx-3 border-t border-sidebar-border" /> : null}

      <div className={cn("flex min-h-0 flex-1 flex-col py-2.5", collapsed ? "overflow-visible px-1.5" : "px-3")}>
        {!collapsed ? (
          <>
            <SectionLabel
              action={
                <button
                  type="button"
                  onClick={() => setAdding((v) => !v)}
                  aria-label="Add workstream"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-accent"
                >
                  <IconPlus size={14} />
                </button>
              }
            >
              Workstreams{total > 0 ? ` · ${total}` : ""}
            </SectionLabel>

            <div className="relative mb-2.5">
              <IconSearch
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sidebar-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  hiddenWorkstreamCount > 0 && !searching
                    ? `Search ${hiddenWorkstreamCount} more workstreams…`
                    : "Search workstreams…"
                }
                className="w-full rounded-lg border border-sidebar-border bg-sidebar-surface py-1.5 pl-8 pr-8 text-[11px] text-sidebar-text placeholder:text-sidebar-muted focus:border-sidebar-accent/40 focus:outline-none focus:ring-2 focus:ring-sidebar-accent/10"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
                >
                  ×
                </button>
              ) : null}
            </div>

            {adding ? (
              <form onSubmit={handleCreate} className="mb-2.5 space-y-2 rounded-lg border border-sidebar-border bg-sidebar-surface p-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ship, design, ops"
                  autoFocus
                  className="w-full rounded-md border border-sidebar-border bg-sidebar-hover px-2.5 py-1.5 text-xs text-sidebar-text focus:border-sidebar-accent/40 focus:outline-none focus:ring-2 focus:ring-sidebar-accent/10"
                />
                <div className="flex gap-1.5">
                  <button type="submit" className="flex-1 rounded-md bg-accent py-1.5 text-[11px] font-medium text-white">
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdding(false);
                      setName("");
                    }}
                    className="flex-1 rounded-md border border-sidebar-border py-1.5 text-[11px] font-medium text-sidebar-muted hover:bg-sidebar-hover"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5 [-webkit-overflow-scrolling:touch]">
              {loading && channels.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-sidebar-muted">Loading workstreams…</p>
              ) : null}

              {showEmpty && !query ? (
                <div className="rounded-lg border border-dashed border-sidebar-border bg-sidebar-hover/60 px-3 py-5 text-center">
                  <p className="text-xs font-medium text-sidebar-text">No workstreams yet</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-sidebar-muted">
                    Group tasks by area — ship, design, ops, etc.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="mt-3 inline-flex items-center gap-1 rounded-md bg-sidebar-accent/12 px-2.5 py-1.5 text-[11px] font-medium text-sidebar-accent hover:bg-sidebar-accent/18"
                  >
                    <IconPlus size={12} />
                    Add one
                  </button>
                </div>
              ) : null}

              {showEmpty && query ? (
                <p className="px-2 py-6 text-center text-xs text-sidebar-muted">No workstreams match “{query}”</p>
              ) : null}

              <nav className="space-y-0">
                {visibleChannels.map((channel, index) => (
                  <WorkstreamRow
                    key={channel.id}
                    channel={channel}
                    index={index}
                    isActive={activeChannelId === channel.id}
                    onRename={handleRename}
                    onArchive={handleArchive}
                    collapsed={false}
                  />
                ))}
              </nav>
            </div>

            {hiddenWorkstreamCount > 0 && !searching ? (
              <p className="mt-2 px-1 text-center text-[10px] leading-relaxed text-sidebar-muted">
                Showing {visibleChannels.length} of {total}. Search for the rest.
              </p>
            ) : null}

            {hasMore && searching ? (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="mt-2 w-full rounded-lg border border-sidebar-border bg-sidebar-surface py-2 text-[11px] font-medium text-sidebar-muted transition-colors hover:border-sidebar-accent/30 hover:bg-sidebar-hover disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more workstreams"}
              </button>
            ) : null}
          </>
        ) : (
          <>
            <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" aria-hidden="true" />
            <nav className="min-h-0 flex-1 space-y-1 overflow-visible">
              {channels.slice(0, VISIBLE_WORKSTREAMS).map((channel, index) => (
                <WorkstreamRow
                  key={channel.id}
                  channel={channel}
                  index={index}
                  isActive={activeChannelId === channel.id}
                  onRename={handleRename}
                  onArchive={handleArchive}
                  collapsed
                />
              ))}
            </nav>
            {channels.length > VISIBLE_WORKSTREAMS ? (
              <button
                type="button"
                onClick={onRequestExpand}
                className="group relative mt-1 w-full rounded-md py-1 text-center text-[10px] font-medium text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
                title="Expand sidebar to see all workstreams"
              >
                +{Math.max(total, channels.length) - VISIBLE_WORKSTREAMS} more
                <SidebarHoverLabel
                  label="More workstreams"
                  meta={`+${Math.max(total, channels.length) - VISIBLE_WORKSTREAMS}`}
                />
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
