import { useState } from "react";
import { api } from "../api.js";
import FoveaLogo from "../components/FoveaLogo.jsx";
import FocusAmbient from "../components/FocusAmbient.jsx";
import LoginHeroCollage from "../components/LoginHeroCollage.jsx";
import LegalFooter from "../components/LegalFooter.jsx";
import { isLocalHost } from "../lib/ensureHttps.js";
import { tw, cn } from "../lib/tw.js";

const GOOGLE_AUTH_MESSAGE = "fovea:google-auth";

function isTrustedAuthOrigin(origin) {
  if (origin === window.location.origin) return true;
  try {
    return isLocalHost(window.location.hostname) && isLocalHost(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export default function Login({ status, authError, onSignedIn }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const continueLocal = async () => {
    setBusy(true);
    setError("");
    try {
      await api.devLogin();
      await onSignedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const continueGoogle = () => {
    setError("");
    setBusy(true);
    const useRedirect =
      window.matchMedia("(max-width: 1023px)").matches ||
      Boolean(window.fovea?.isMobileShell);
    if (useRedirect) {
      window.location.href = "/auth/google";
      return;
    }
    const width = 480;
    const height = 700;
    const left = Math.round(window.screenX + Math.max(0, (window.outerWidth - width) / 2));
    const top = Math.round(window.screenY + Math.max(0, (window.outerHeight - height) / 2));
    const popup = window.open(
      "/auth/google?popup=1",
      "fovea-google-auth",
      `width=${width},height=${height},left=${left},top=${top}`,
    );
    if (!popup) {
      window.location.href = "/auth/google";
      return;
    }

    let done = false;
    const finish = async ({ failed = false } = {}) => {
      if (done) return;
      done = true;
      window.removeEventListener("message", onMessage);
      clearInterval(poll);
      if (failed) {
        setError("Google sign-in was cancelled or failed.");
        setBusy(false);
        return;
      }
      try {
        await onSignedIn();
      } finally {
        setBusy(false);
      }
    };

    const onMessage = (event) => {
      if (!isTrustedAuthOrigin(event.origin)) return;
      if (event.data?.type !== GOOGLE_AUTH_MESSAGE) return;
      finish({ failed: !event.data.ok });
    };

    const poll = setInterval(() => {
      if (!popup.closed) return;
      finish();
    }, 400);

    window.addEventListener("message", onMessage);
  };

  return (
    <div className="login-shell relative flex min-h-full min-h-dvh flex-col overflow-x-hidden bg-paper">
      <FocusAmbient variant="page" />
      <div className="login-layout relative z-[1] min-w-0 flex-1">
        <section className="login-hero">
          <div className="login-hero-inner">
            <div className="login-hero-brand">
              <FoveaLogo
                size="lg"
                layout="brand"
                subtitle="Your week, one clear priority."
                subtitleProminent
              />
            </div>
            <h1 className="login-hero-title">
              Focus on the <span className="text-accent">right task</span> this week.
            </h1>
            <p className="login-hero-copy">
              Your top task front and center — everything due this week stays visible around it.
            </p>

            <LoginHeroCollage className="mt-8" />

            <p className="login-hero-caption mt-4 text-center">
              This week&apos;s focus · Other tasks due this week
            </p>
          </div>
        </section>

        <section className="login-auth">
          <div className="login-auth-inner">
            <div className="login-auth-brand">
              <FoveaLogo size="sm" />
              <p className="login-auth-tagline">Your week, one clear priority.</p>
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
                <button
                  type="button"
                  disabled={busy}
                  onClick={continueGoogle}
                  className={cn(tw.btn, "w-full justify-center disabled:opacity-50")}
                >
                  {busy ? "Signing in…" : "Continue with Google"}
                </button>
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

            <LegalFooter className="mt-8" />
          </div>
        </section>
      </div>
    </div>
  );
}
