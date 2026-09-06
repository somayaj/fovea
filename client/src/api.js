async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const error = new Error(data.error || res.statusText);
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  status: () => request("/auth/status"),
  me: () => request("/api/me"),
  devLogin: () => request("/auth/dev", { method: "POST" }),
  logout: () => request("/auth/logout", { method: "POST" }),
  map: (projectId) => request(`/api/projects/${projectId}/map`),
  mapView: (projectId, { scope, channel, weekFocus, channelPage, taskPage } = {}) => {
    const params = new URLSearchParams();
    if (scope) params.set("scope", JSON.stringify(scope));
    if (channel) params.set("channel", channel);
    if (weekFocus) params.set("weekFocus", weekFocus);
    if (channelPage != null) params.set("channelPage", String(channelPage));
    if (taskPage != null) params.set("taskPage", String(taskPage));
    const qs = params.toString();
    return request(`/api/projects/${projectId}/map/view${qs ? `?${qs}` : ""}`);
  },
  ideas: (projectId) => request(`/api/projects/${projectId}/ideas`),
  tasks: (projectId, { limit = 50, offset = 0, channel } = {}) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (channel) params.set("channel", channel);
    return request(`/api/projects/${projectId}/tasks?${params}`);
  },
  search: (projectId, q, { limit = 15 } = {}) => {
    const params = new URLSearchParams({ q, limit: String(limit) });
    return request(`/api/projects/${projectId}/search?${params}`);
  },
  savePositions: (projectId, nodes) =>
    request(`/api/projects/${projectId}/map`, {
      method: "PUT",
      body: JSON.stringify({ nodes }),
    }),
  channels: (projectId, { q, limit = 50, offset = 0 } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    return request(`/api/projects/${projectId}/channels?${params}`);
  },
  channel: (channelId) => request(`/api/channels/${channelId}`),
  createChannel: (projectId, name) =>
    request(`/api/projects/${projectId}/channels`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  patchChannel: (channelId, body) =>
    request(`/api/channels/${channelId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  archiveChannel: (channelId) => request(`/api/channels/${channelId}`, { method: "DELETE" }),
  createNode: (body) => request("/api/nodes", { method: "POST", body: JSON.stringify(body) }),
  patchNode: (nodeId, body) =>
    request(`/api/nodes/${nodeId}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteNode: (nodeId) => request(`/api/nodes/${nodeId}`, { method: "DELETE" }),
  getRecurrence: (seriesId) => request(`/api/recurrence/${seriesId}`),
  deleteRecurrence: (seriesId) => request(`/api/recurrence/${seriesId}`, { method: "DELETE" }),
  createEdge: (body) => request("/api/edges", { method: "POST", body: JSON.stringify(body) }),
  deleteEdge: (edgeId) => request(`/api/edges/${edgeId}`, { method: "DELETE" }),
  week: (offset = 0, { neighborLimit = 12, neighborOffset = 0 } = {}) => {
    const params = new URLSearchParams({
      offset: String(offset),
      neighborLimit: String(neighborLimit),
      neighborOffset: String(neighborOffset),
    });
    return request(`/api/week?${params}`);
  },
  setWeekFocus: (taskId, offset = 0) =>
    request(`/api/week/focus?offset=${offset}`, {
      method: "PUT",
      body: JSON.stringify({ taskId }),
    }),
  clearWeekFocus: (offset = 0) =>
    request(`/api/week/focus?offset=${offset}`, { method: "DELETE" }),
  adminUsers: () => request("/api/admin/users"),
  revealAdminUser: (userId) => request(`/api/admin/users/${userId}`),
};
