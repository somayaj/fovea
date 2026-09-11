const isProdEnv = process.env.NODE_ENV === "production";

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

export function stripSlash(url) {
  return String(url || "").replace(/\/$/, "");
}

export function isLocalOrigin(url) {
  try {
    return isLocalHost(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Force https for public production hosts. Preserves path when given a full URL. */
export function ensureHttpsOrigin(origin) {
  if (!origin) return origin;
  try {
    const url = new URL(origin);
    if (isProdEnv && !isLocalHost(url.hostname) && url.protocol === "http:") {
      url.protocol = "https:";
    }
    if (!url.pathname || url.pathname === "/") {
      return stripSlash(url.origin);
    }
    return stripSlash(`${url.origin}${url.pathname}${url.search}${url.hash}`);
  } catch {
    return stripSlash(origin);
  }
}

export function requestOrigin(req) {
  let proto = String(req.get("x-forwarded-proto") || req.protocol || "http")
    .split(",")[0]
    .trim();
  const host = String(req.get("x-forwarded-host") || req.get("host") || "")
    .split(",")[0]
    .trim();
  if (!host) return "";
  if (isProdEnv && !isLocalHost(host)) proto = "https";
  return `${proto}://${host}`;
}

/** Canonical public app URL for redirects (login, logout, OAuth). */
export function canonicalAppOrigin(req) {
  const explicit = ensureHttpsOrigin(stripSlash(process.env.PUBLIC_APP_URL || ""));
  if (explicit) return explicit;

  const client = stripSlash(process.env.CLIENT_ORIGIN || "");
  if (client && !(isProdEnv && isLocalOrigin(client))) {
    return ensureHttpsOrigin(client);
  }

  if (isProdEnv) {
    const host = String(req?.get?.("x-forwarded-host") || req?.get?.("host") || "")
      .split(",")[0]
      .trim()
      .replace(/:\d+$/, "")
      .toLowerCase();
    if (host === "fovea.sh" || host === "www.fovea.sh" || host.endsWith(".fovea.sh")) {
      return "https://fovea.sh";
    }
    const railway = stripSlash(process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL || "");
    if (railway) {
      const hostOnly = railway.replace(/^https?:\/\//, "");
      return `https://${hostOnly}`;
    }
    const fromRequest = ensureHttpsOrigin(requestOrigin(req));
    if (fromRequest) return fromRequest;
    return "https://fovea.sh";
  }

  return "";
}

/** Google OAuth callback — always https in production. */
export function googleCallbackUrl() {
  const fromEnv = stripSlash(process.env.GOOGLE_CALLBACK_URL || "");
  const callbackLooksLocal = /localhost|127\.0\.0\.1/i.test(fromEnv);

  if (fromEnv && !(isProdEnv && callbackLooksLocal)) {
    return ensureHttpsOrigin(fromEnv);
  }

  if (isProdEnv) {
    const base = canonicalAppOrigin(null) || "https://fovea.sh";
    return `${base}/auth/google/callback`;
  }

  return "/auth/google/callback";
}
