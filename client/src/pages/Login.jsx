import { useState } from "react";
import { api } from "../api.js";
import FoveaLogo from "../components/FoveaLogo.jsx";
import FocusAmbient from "../components/FocusAmbient.jsx";
import LoginHeroCollage from "../components/LoginHeroCollage.jsx";
import { tw, cn } from "../lib/tw.js";

export default function Login({ status, authError, onDevLogin }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const continueLocal = async () => {
    setBusy(true);
    setError("");
    try {
      await api.devLogin();
      await onDevLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell relative flex min-h-full bg-paper">
      <FocusAmbient variant="page" />
      <div className="relative z-[1] flex min-w-0 flex-1 flex-col lg:flex-row">
        <section className="relative flex flex-1 flex-col justify-center px-6 py-10 lg:px-12 lg:py-14">
          <div className="mx-auto w-full max-w-3xl">
            <div className="login-hero-brand">
              <FoveaLogo
                size="lg"
                layout="brand"
                subtitle="Your week, one clear priority."
                subtitleProminent
              />
            </div>
            <h1 className="mt-6 text-[clamp(1.875rem,4.5vw,2.75rem)] font-semibold leading-[1.12] tracking-tight text-brand">
              Focus on the <span className="text-accent">right task</span> this week.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted lg:text-base">
              Your top task front and center — everything due this week stays visible around it.
            </p>

            <LoginHeroCollage className="mt-8" />

            <p className="login-hero-caption mt-4 text-center">
              This week&apos;s focus · Other tasks due this week
            </p>
          </div>
        </section>

        <section
          className={cn(
            "flex w-full shrink-0 items-center justify-center border-t border-line/80 bg-surface px-8 py-12 lg:w-[400px] lg:border-t-0 lg:border-l lg:py-0",
          )}
        >
          <div className="w-full max-w-[320px]">
            <div className="mb-8 lg:hidden">
              <FoveaLogo size="sm" subtitle="Your week, one clear priority." subtitleProminent />
            </div>

            <p className={tw.labelAccent}>Sign in</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-brand">Welcome back</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Open your workspace and pick up where you left off.
            </p>

            {authError ? (
              <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {authError}
              </p>
            ) : null}

            {error ? (
              <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-3">
              {!status && !authError ? <p className="text-sm text-muted">Connecting…</p> : null}
              {status?.google ? (
                <a className={cn(tw.btn, "w-full justify-center")} href="/auth/google">
                  Continue with Google
                </a>
              ) : null}
              {status?.devLogin ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={continueLocal}
                  className={cn(tw.btnOutline, "w-full justify-center disabled:opacity-50")}
                >
                  {busy ? "Signing in…" : "Continue with local account"}
                </button>
              ) : null}
              {status && !status.google && !status.devLogin ? (
                <p className="text-sm text-muted">No sign-in methods configured.</p>
              ) : null}
            </div>

            <div className={cn(tw.card, "mt-10 overflow-hidden")}>
              <p className="px-4 py-3 text-xs leading-relaxed text-muted">
                Sign in to open your map, set this week&apos;s focus, and keep every task in view.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
