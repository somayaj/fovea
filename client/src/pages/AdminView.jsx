import { useEffect, useState } from "react";
import { api } from "../api.js";
import FocusPageShell from "../components/FocusPageShell.jsx";
import { IconList, IconUsers } from "../components/icons.jsx";
import { PageHeader, StatPill, EmptyPanel } from "../components/PageHeader.jsx";
import { tw, cn } from "../lib/tw.js";

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
        <p className="admin-task-count" title="Tasks created">
          <span className="admin-task-count-value">{taskCount.toLocaleString()}</span>
          <span className="admin-task-count-label">task{taskCount === 1 ? "" : "s"}</span>
        </p>
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revealingId, setRevealingId] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.adminUsers();
        if (cancelled) return;
        setCount(data.count || 0);
        setTotalTasks(data.totalTasks || 0);
        setUsers(data.users || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const reveal = async (userId) => {
    setRevealingId(userId);
    setError("");
    try {
      const data = await api.revealAdminUser(userId);
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, ...data.user } : user)));
    } catch (err) {
      setError(err.message || "Could not reveal user");
    } finally {
      setRevealingId("");
    }
  };

  const hide = (userId) => {
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== userId) return user;
        const { name, email, avatar, ...rest } = user;
        return rest;
      }),
    );
  };

  return (
    <FocusPageShell fill className="overflow-auto">
      <PageHeader
        icon={<IconUsers size={13} />}
        eyebrow="Admin"
        title="Users & tasks"
        description="Each row shows last login and how many tasks that user has created."
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
                  user={user}
                  revealing={revealingId === user.id}
                  onReveal={reveal}
                  onHide={hide}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </FocusPageShell>
  );
}
