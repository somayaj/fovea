const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let initialized = false;

function hasGtag() {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

export function isAnalyticsEnabled() {
  return Boolean(MEASUREMENT_ID);
}

export function initAnalytics() {
  if (initialized || !MEASUREMENT_ID || typeof document === "undefined") return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });

  initialized = true;
}

export function trackPageView(path) {
  if (!MEASUREMENT_ID || !hasGtag()) return;
  window.gtag("config", MEASUREMENT_ID, { page_path: path });
}

export function trackEvent(name, params = {}) {
  if (!MEASUREMENT_ID || !hasGtag()) return;
  window.gtag("event", name, params);
}
