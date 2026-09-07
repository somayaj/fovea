export function isLocalHost(hostname) {
  const host = String(hostname || "").split(":")[0].toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
}

/** Redirect to HTTPS on production hosts. Returns true if a redirect was started. */
export function ensureHttpsOrigin(path = "/") {
  if (typeof window === "undefined") return false;
  if (window.location.protocol !== "http:" || isLocalHost(window.location.hostname)) return false;
  const target = `https://${window.location.host}${path}`;
  window.location.replace(target);
  return true;
}
