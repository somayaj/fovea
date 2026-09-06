import { useEffect, useState } from "react";
import { api } from "../api.js";
import { IconUsers } from "../components/icons.jsx";
import { PageHeader, StatPill } from "../components/PageHeader.jsx";
import { cn, tw } from "../lib/tw.js";

function formatLogin(iso) {
  if (!iso) return "Unknown";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function UserRow({ user, onReveal, onHide, revealing }) {
  const revealed = Boolean(user.name || user.email);

  return (
    <tr className="border-t border-line/70">
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/12 text-[11px] font-bold text-accent">
            {revealed && user.avatar ? (
              <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              "••"
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-stone-900">
              {revealed ? user.name || "Unnamed" : user.nameMasked}
            </p>
            <p className="truncate text-xs text-stone-500">
              {revealed ? user.email || "No email" : user.emailMasked}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs capitalize text-stone-600">{user.method}</td>
      <td className="px-4 py-3 text-sm text-stone-800">{formatLogin(user.lastLoginAt)}</td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          disabled={revealing}
          onClick={() => (revealed ? onHide(user.id) : onReveal(user.id))}
          className={cn(tw.btnOutlineSm, "disabled:opacity-50")}
        >
          {revealing ? "…" : revealed ? "Hide PII" : "Reveal"}
        </button>
      </td>
    </tr>
  );
}

export default function AdminView() {
  const [count, setCount] = useState(0);
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
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <PageHeader
        icon={<IconUsers size={14} />}
        eyebrow="Admin"
        title="Signed-in users"
        description="PII stays hidden until you reveal a row. Login time is the most recent sign-in."
      />

      <div className="mx-auto w-full max-w-5xl space-y-6 px-5 py-6 md:px-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatPill icon={<IconUsers size={16} />} label="Users logged in" value={loading ? "…" : String(count)} />
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <div className={cn(tw.card, "overflow-hidden")}>
          {loading ? (
            <p className="px-4 py-8 text-sm text-stone-500">Loading users…</p>
          ) : users.length === 0 ? (
            <p className="px-4 py-8 text-sm text-stone-500">No users have logged in yet.</p>
          ) : (
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-white/60 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Sign-in</th>
                  <th className="px-4 py-3">Last login</th>
                  <th className="px-4 py-3 text-right">PII</th>
                </tr>
              </thead>
              <tbody className="bg-[#fdfbf7]">
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    revealing={revealingId === user.id}
                    onReveal={reveal}
                    onHide={hide}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
