import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AnalyticsTracker from "./components/AnalyticsTracker.jsx";
import { applyFoveaTheme } from "./lib/foveaTheme.js";
import { initMobileShell } from "./lib/mobileShell.js";
import { initAnalytics } from "./lib/analytics.js";
import App from "./App.jsx";
import "./index.css";

applyFoveaTheme();
initMobileShell();
initAnalytics();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AnalyticsTracker />
      <App />
    </BrowserRouter>
  </StrictMode>,
);
