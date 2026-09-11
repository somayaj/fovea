import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { api, SESSION_EXPIRED_EVENT } from "./api.js";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import AppShell from "./pages/AppShell.jsx";
import BrainstormView from "./pages/BrainstormView.jsx";
import LicensePage from "./pages/LicensePage.jsx";
import Login from "./pages/Login.jsx";
import MapView from "./pages/MapView.jsx";
import AdminView from "./pages/AdminView.jsx";
import PrivacyPage from "./pages/PrivacyPage.jsx";
import RoadmapView from "./pages/RoadmapView.jsx";
import WeekView from "./pages/WeekView.jsx";
import { ROADMAP_ENABLED } from "./lib/features.js";
import { ensureHttpsOrigin, isLocalHost } from "./lib/ensureHttps.js";
import { clearMobileShell } from "./lib/mobileShell.js";

function currentPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function ChannelMapRedirect() {
  const { channelId } = useParams();
  return <Navigate to={`/map?channel=${channelId}`} replace />;
}

function AuthenticatedApp({ me, onLogout }) {
  return (
    <Routes>
      <Route element={<AppShell me={me} onLogout={onLogout} />}>
        <Route path="/" element={<WeekView />} />
        <Route path="/admin" element={me.user?.isAdmin ? <AdminView /> : <Navigate to="/" replace />} />
        <Route path="/map" element={<MapView me={me} />} />
        {ROADMAP_ENABLED ? <Route path="/roadmap" element={<RoadmapView me={me} />} /> : null}
        <Route path="/brainstorm" element={<BrainstormView me={me} />} />
        <Route path="/c/:channelId" element={<ChannelMapRedirect />} />
        <Route path="/channels" element={<Navigate to="/map" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const [status, setStatus] = useState(null);
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState("");

  const refresh = async () => {
    try {
      const nextStatus = await api.status();
      setStatus(nextStatus);
      setAuthError("");
      if (nextStatus.me) {
        setMe(nextStatus.me);
      } else if (nextStatus.user) {
        const nextMe = await api.me();
        setMe(nextMe);
      } else {
        setMe(null);
      }
    } catch {
      const onLocalhost = isLocalHost(window.location.hostname);
      setStatus({ google: false, devLogin: onLocalhost, user: null });
      setAuthError("Can't reach the server. Run npm run dev in the project folder.");
      setMe(null);
    }
    setReady(true);
  };

  const returnToLogin = useCallback(async ({ callLogout = false } = {}) => {
    if (callLogout) {
      try {
        await api.logout();
      } catch {
        // Session may already be gone.
      }
    }

    setMe(null);
    setAuthError("");
    clearMobileShell();

    try {
      const nextStatus = await api.status();
      setStatus(nextStatus);
    } catch {
      const onLocalhost = isLocalHost(window.location.hostname);
      setStatus({ google: !onLocalhost, devLogin: onLocalhost, user: null });
    }

    if (ensureHttpsOrigin("/")) return;

    if (window.location.pathname !== "/" || window.location.search || window.location.hash) {
      window.history.replaceState(null, "", "/");
    }
  }, []);

  useEffect(() => {
    if (ensureHttpsOrigin(currentPath())) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "google") {
      setAuthError("Google sign-in was cancelled or failed.");
      params.delete("error");
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `/?${qs}` : "/");
    }
    refresh();
  }, []);

  useEffect(() => {
    const onSessionExpired = () => {
      returnToLogin();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [returnToLogin]);

  const logout = () => returnToLogin({ callLogout: true });

  return (
    <ThemeProvider accountThemeId={me?.user?.themeId ?? null}>
      <Routes>
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/license" element={<LicensePage />} />
        <Route
          path="/*"
          element={
            !ready ? null : !me ? (
              <Login status={status} authError={authError} onSignedIn={refresh} />
            ) : (
              <AuthenticatedApp me={me} onLogout={logout} />
            )
          }
        />
      </Routes>
    </ThemeProvider>
  );
}
