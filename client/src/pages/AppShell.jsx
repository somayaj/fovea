import { useEffect, useState, useCallback } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import ChannelSidebar from "../components/ChannelSidebar.jsx";
import { ChannelsProvider } from "../context/ChannelsContext.jsx";
import FoveaLogo, { FoveaMark } from "../components/FoveaLogo.jsx";
import SidebarHoverLabel from "../components/SidebarHoverLabel.jsx";
import { IconChevronLeft, IconChevronRight, IconPanelLeft } from "../components/icons.jsx";
import { cn } from "../lib/tw.js";

const SIDEBAR_STORAGE_KEY = "fovea.sidebar.collapsed";

function initials(name, email) {
  const source = name || email || "?";
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function SidebarBrand({ collapsed, onToggle }) {
  return (
    <div
      className={cn(
        "shrink-0 border-b border-stone-200/80",
        collapsed ? "px-2 py-3" : "flex items-center justify-between gap-2 px-3 py-3.5",
      )}
    >
      <Link
        to="/"
        className={cn(
          "group relative block rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/30",
          collapsed && "flex justify-center",
        )}
      >
        {collapsed ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <FoveaMark size={20} />
          </span>
        ) : (
          <FoveaLogo size="sm" />
        )}
        {collapsed ? <SidebarHoverLabel label="Fovea" meta="Home" /> : null}
      </Link>

      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        className={cn(
          "group relative hidden shrink-0 items-center justify-center rounded-lg border border-stone-200/80 bg-white/80 text-stone-500 shadow-sm transition-colors hover:border-stone-300 hover:bg-white hover:text-stone-800 lg:flex",
          collapsed ? "mx-auto mt-2 h-8 w-8" : "h-8 w-8",
        )}
      >
        {collapsed ? <IconChevronRight size={15} /> : <IconPanelLeft size={15} />}
        {collapsed ? <SidebarHoverLabel label="Expand sidebar" /> : null}
      </button>
    </div>
  );
}

function SidebarUser({ user, onLogout, collapsed }) {
  if (collapsed) {
    return (
      <div className="shrink-0 space-y-2 border-t border-stone-200/80 p-2">
        <div
          className="group relative mx-auto flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-accent/12 text-[10px] font-bold text-accent"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(user?.name, user?.email)
          )}
          <SidebarHoverLabel label={user?.name || "User"} meta={user?.email} />
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="group relative mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-white hover:text-stone-700"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          <SidebarHoverLabel label="Sign out" />
        </button>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-line/80 p-3">
      <div className="flex items-center gap-2 rounded-lg border border-line/80 bg-[#fdfbf7]/80 px-2 py-2 shadow-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/12 text-[11px] font-bold text-accent">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(user?.name, user?.email)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-stone-900">{user?.name || "User"}</div>
          {user?.email ? (
            <div className="truncate text-[10px] text-stone-400">{user.email}</div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="shrink-0 rounded-md px-2 py-1 text-[10px] font-medium text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
          title="Sign out"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function AppShell({ me, onLogout }) {
  const user = me.user;
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1",
  );

  const toggleCollapsed = useCallback(() => {
    setCollapsed((v) => {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("fovea:refit-view"));
      }, 220);
      return !v;
    });
  }, []);
  const expandSidebar = () => setCollapsed(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "[" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      e.preventDefault();
      toggleCollapsed();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

  const gridClass = collapsed ? "lg:grid-cols-[64px_1fr]" : "lg:grid-cols-[252px_1fr]";

  return (
    <ChannelsProvider projectId={me.project?.id}>
      <div className={cn("flex h-full flex-col bg-paper lg:grid lg:grid-rows-1", gridClass)}>
        {navOpen ? (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm lg:hidden"
            onClick={() => setNavOpen(false)}
          />
        ) : null}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex min-h-0 w-[min(280px,88vw)] flex-col border-r border-line/80 bg-gradient-to-b from-[#fdfbf7] to-[#f0ebe3] transition-[width,transform] duration-200 ease-out lg:static lg:z-auto lg:translate-x-0",
            collapsed ? "lg:w-16 lg:overflow-visible" : "lg:w-[252px]",
            navOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0",
          )}
        >
          <SidebarBrand collapsed={collapsed} onToggle={toggleCollapsed} />
          <ChannelSidebar
            collapsed={collapsed}
            onRequestExpand={expandSidebar}
            isAdmin={Boolean(user?.isAdmin)}
          />
          <SidebarUser user={user} onLogout={onLogout} collapsed={collapsed} />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center gap-3 border-b border-line/80 bg-[#fdfbf7] px-4 py-2.5 lg:hidden">
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <FoveaLogo size="xs" />
          </header>

          <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-paper">
            <Outlet />
          </main>
        </div>
      </div>
    </ChannelsProvider>
  );
}
