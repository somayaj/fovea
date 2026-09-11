function isPrivateLanHost(hostname) {
  const host = String(hostname || "").split(":")[0];
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return host.endsWith(".local");
}

export function isLocalHost(hostname) {
  const host = String(hostname || "").split(":")[0].toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host === "::1" ||
    isPrivateLanHost(host)
  );
}

/** Redirect to HTTPS on production hosts. Returns true if a redirect was started. */
export function ensureHttpsOrigin(path = "/") {
  if (typeof window === "undefined") return false;
  if (window.location.protocol !== "http:" || isLocalHost(window.location.hostname)) return false;
  const safePath = path.startsWith("/") ? path : `/${path}`;
  window.location.replace(`https://${window.location.host}${safePath}`);
  return true;
}
