import { isLocalHost } from "./ensureHttps.js";

const PROD_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const DEV_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID_DEV;

let initialized = false;

function isProductionHost(hostname) {
  const host = String(hostname || "").split(":")[0].toLowerCase();
  return host === "fovea.sh" || host.endsWith(".fovea.sh");
}

function measurementId() {
  if (typeof window === "undefined") return null;
  const hostname = window.location.hostname;
  if (isLocalHost(hostname)) return null;
  if (isProductionHost(hostname)) return PROD_MEASUREMENT_ID || null;
  return DEV_MEASUREMENT_ID || null;
}

function hasGtag() {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

export function isAnalyticsEnabled() {
  return Boolean(measurementId());
}

export function initAnalytics() {
  const id = measurementId();
  if (initialized || !id || typeof document === "undefined") return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", id, { send_page_view: false });

  initialized = true;
}

export function trackPageView(path) {
  const id = measurementId();
  if (!id || !hasGtag()) return;
  window.gtag("config", id, { page_path: path });
}

export function trackEvent(name, params = {}) {
  const id = measurementId();
  if (!id || !hasGtag()) return;
  window.gtag("event", name, params);
}
