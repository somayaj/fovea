function adminEmails() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user) {
  const email = String(user?.email || "")
    .trim()
    .toLowerCase();
  return Boolean(email && adminEmails().includes(email));
}

export function requireAdmin(req, res, next) {
  if (req.isAuthenticated?.() && req.user && isAdminUser(req.user)) return next();
  return res.status(403).json({ error: "Admin access required" });
}

export function maskName(name) {
  const value = String(name || "").trim();
  if (!value) return "Hidden";
  const first = value[0];
  return `${first}${"•".repeat(Math.max(3, Math.min(value.length - 1, 8)))}`;
}

export function maskEmail(email) {
  const value = String(email || "").trim();
  const at = value.indexOf("@");
  if (at < 1) return "•••@•••";
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const domainDot = domain.indexOf(".");
  const host = domainDot >= 0 ? domain.slice(0, domainDot) : domain;
  const tld = domainDot >= 0 ? domain.slice(domainDot) : "";
  return `${local[0]}•••@${host[0] || "•"}•••${tld}`;
}

export function summarizeUser(user) {
  return {
    id: user.id,
    nameMasked: maskName(user.name),
    emailMasked: maskEmail(user.email),
    lastLoginAt: user.last_login_at || user.created_at,
    createdAt: user.created_at,
    method: user.google_sub === "dev-local" ? "local" : "google",
  };
}

export function revealUser(user) {
  return {
    ...summarizeUser(user),
    name: user.name || "",
    email: user.email || "",
    avatar: user.avatar || null,
  };
}
