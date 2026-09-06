import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { api } from "./api.js";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import AppShell from "./pages/AppShell.jsx";
import BrainstormView from "./pages/BrainstormView.jsx";
import Login from "./pages/Login.jsx";
import MapView from "./pages/MapView.jsx";
import WeekView from "./pages/WeekView.jsx";

function ChannelMapRedirect() {
  const { channelId } = useParams();
  return <Navigate to={`/map?channel=${channelId}`} replace />;
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
      if (nextStatus.user) {
        const nextMe = await api.me();
        setMe(nextMe);
      } else {
        setMe(null);
      }
    } catch {
      const host = window.location.hostname;
      const onLocalhost = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
      setStatus({ google: false, devLogin: onLocalhost, user: null });
      setAuthError("Can't reach the server. Run npm run dev in the project folder.");
      setMe(null);
    }
    setReady(true);
  };

  useEffect(() => {
    refresh();
  }, []);

  if (!ready) return null;

  if (!me) {
    return (
      <ThemeProvider>
        <Login status={status} authError={authError} onDevLogin={refresh} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Routes>
      <Route
        element={
          <AppShell
            me={me}
            onLogout={async () => {
              await api.logout();
              setMe(null);
            }}
          />
        }
      >
        <Route path="/" element={<WeekView />} />
        <Route path="/map" element={<MapView me={me} />} />
        <Route path="/brainstorm" element={<BrainstormView me={me} />} />
        <Route path="/c/:channelId" element={<ChannelMapRedirect />} />
        <Route path="/channels" element={<Navigate to="/map" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </ThemeProvider>
  );
}
