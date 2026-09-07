import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import FocusPageShell from "../components/FocusPageShell.jsx";
import { IconList, IconUsers } from "../components/icons.jsx";
import { PageHeader, StatPill, EmptyPanel } from "../components/PageHeader.jsx";
import { DEFAULT_THEME_ID, getThemePreset } from "../lib/foveaTheme.js";
import { tw, cn } from "../lib/tw.js";

const PAGE_SIZE = 25;

function themeDisplay(themeId) {
  const id = themeId || DEFAULT_THEME_ID;
  const preset = getThemePreset(id);
  return {
    label: preset.label || id,
    swatch: preset.palette?.swatch || "#cccccc",
  };
}

function formatLogin(iso) {
  if (!iso) return "Unknown";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isRecent(iso) {
  if (!iso) return false;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then < 24 * 60 * 60 * 1000;
}

function UserRow({ user, onReveal, onHide, revealing }) {
  const revealed = Boolean(user.name || user.email);
  const taskCount = user.taskCount ?? 0;
  const theme = themeDisplay(user.themeId);

  return (
    <li className="admin-row">
      <div className="admin-row-user">
        <div className="admin-avatar">
          {revealed && user.avatar ? (
            <img src={user.avatar} alt="" />
          ) : (
            <span>{revealed ? (user.name || "?").slice(0, 1) : "•"}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className={revealed ? "admin-name is-open" : "admin-name is-hidden"}>
            {revealed ? user.name || "Unnamed" : user.nameMasked}
          </p>
          <p className={revealed ? "admin-email is-open" : "admin-email is-hidden"}>
            {revealed ? user.email || "No email" : user.emailMasked}
          </p>
        </div>
      </div>

      <div className="admin-row-meta">
        <div className="admin-login-details">
          <span className={`admin-method ${user.method}`}>{user.method}</span>
          <p className="admin-login">
            <span className={isRecent(user.lastLoginAt) ? "admin-dot is-live" : "admin-dot"} />
            {formatLogin(user.lastLoginAt)}
          </p>
        </div>
        <div className="admin-row-stats">
          <p className="admin-task-count" title="Tasks created">
            <span className="admin-task-count-value">{taskCount.toLocaleString()}</span>
            <span className="admin-task-count-label">task{taskCount === 1 ? "" : "s"}</span>
          </p>
          <p className="admin-theme-badge" title="Color theme">
            <span className="admin-theme-swatch" style={{ background: theme.swatch }} aria-hidden="true" />
            <span className="admin-theme-label">{theme.label}</span>
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={revealing}
        onClick={() => (revealed ? onHide(user.id) : onReveal(user.id))}
        className={cn(revealed ? tw.btnOutlineSm : tw.btnSm, "admin-reveal shrink-0 disabled:opacity-50")}
      >
        {revealing ? "…" : revealed ? "Hide PII" : "Reveal"}
      </button>
    </li>
  );
}

export default function AdminView() {
  const [count, setCount] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [revealedById, setRevealedById] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revealingId, setRevealingId] = useState("");

  const loadUsers = useCallback(async (nextPage = 0) => {
    setLoading(true);
    setError("");
    try {
      const data = await api.adminUsers({
        limit: PAGE_SIZE,
        offset: nextPage * PAGE_SIZE,
      });
      setCount(data.count || 0);
      setTotalTasks(data.totalTasks || 0);
      setUsers(data.users || []);
      setHasMore(Boolean(data.hasMore));
      setPage(nextPage);
    } catch (err) {
      setError(err.message || "Could not load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(0);
  }, [loadUsers]);

  const reveal = async (userId) => {
    setRevealingId(userId);
    setError("");
    try {
      const data = await api.revealAdminUser(userId);
      setRevealedById((prev) => ({ ...prev, [userId]: data.user }));
    } catch (err) {
      setError(err.message || "Could not reveal user");
    } finally {
      setRevealingId("");
    }
  };

  const hide = (userId) => {
    setRevealedById((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const pageStart = count === 0 ? 0 : page * PAGE_SIZE + 1;
  const pageEnd = Math.min(count, (page + 1) * PAGE_SIZE);
  const showPagination = count > PAGE_SIZE;

  return (
    <FocusPageShell fill className="overflow-auto">
      <PageHeader
        icon={<IconUsers size={13} />}
        eyebrow="Admin"
        title="Users & tasks"
        description="Each row shows last login, task count, and color theme."
        actions={
          <>
            <StatPill icon={<IconUsers size={16} />} label="Logged in" value={loading ? "…" : String(count)} />
            <StatPill icon={<IconList size={16} />} label="Tasks" value={loading ? "…" : String(totalTasks)} />
          </>
        }
      />

      <div className="mx-auto w-full max-w-4xl px-5 py-8 md:px-8">
        {error ? (
          <p className="mb-5 text-center text-sm text-amber-900">{error}</p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted">Loading users…</p>
        ) : users.length === 0 ? (
          <div className={cn(tw.card, "w-full")}>
            <EmptyPanel
              icon={<IconUsers size={22} />}
              title="No sign-ins yet"
              description="When people log in, they will show up here."
            />
          </div>
        ) : (
          <div className={cn(tw.card, "w-full overflow-hidden p-3 pb-5")}>
            <div className="admin-list-head px-2">
              <span>User</span>
              <span>Login & tasks</span>
              <span className="text-right">PII</span>
            </div>
            <ul className="admin-list">
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={{ ...user, ...revealedById[user.id] }}
                  revealing={revealingId === user.id}
                  onReveal={reveal}
                  onHide={hide}
                />
              ))}
            </ul>
            {showPagination ? (
              <div className="admin-pagination">
                <p className="admin-pagination-meta">
                  Showing {pageStart.toLocaleString()}–{pageEnd.toLocaleString()} of {count.toLocaleString()}
                </p>
                <div className="admin-pagination-actions">
                  <button
                    type="button"
                    disabled={page === 0 || loading}
                    onClick={() => loadUsers(page - 1)}
                    className={cn(tw.btnOutlineSm, "disabled:opacity-50")}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={!hasMore || loading}
                    onClick={() => loadUsers(page + 1)}
                    className={cn(tw.btnOutlineSm, "disabled:opacity-50")}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </FocusPageShell>
  );
}
