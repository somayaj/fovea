import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isAnalyticsEnabled, trackPageView } from "../lib/analytics.js";

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;
    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
}
