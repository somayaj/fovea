import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api.js";

const ChannelsContext = createContext(null);
const SIDEBAR_LIMIT = 10;
const SEARCH_LIMIT = 50;

export function ChannelsProvider({ projectId, children }) {
  const [channels, setChannels] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [channelsVersion, setChannelsVersion] = useState(0);
  const [archivedChannels, setArchivedChannels] = useState([]);
  const requestId = useRef(0);

  const fetchArchived = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await api.channels(projectId, { archived: true, limit: 50 });
      setArchivedChannels(data.channels || []);
    } catch {
      setArchivedChannels([]);
    }
  }, [projectId]);

  const fetchPage = useCallback(
    async ({ q = "", offset = 0, append = false } = {}) => {
      if (!projectId) return;
      const id = ++requestId.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const limit = q.trim() ? SEARCH_LIMIT : SIDEBAR_LIMIT;
        const data = await api.channels(projectId, { q, limit, offset });
        if (id !== requestId.current) return;
        setChannels((prev) => (append ? [...prev, ...data.channels] : data.channels));
        setTotal(data.total);
        setHasMore(data.hasMore);
        setSearch(q);
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [projectId],
  );

  useEffect(() => {
    fetchPage({ q: "", offset: 0, append: false }).catch(console.error);
    fetchArchived().catch(console.error);
  }, [fetchPage, fetchArchived]);

  const searchChannels = useCallback(
    (q) => {
      fetchPage({ q, offset: 0, append: false }).catch(console.error);
    },
    [fetchPage],
  );

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    fetchPage({ q: search, offset: channels.length, append: true }).catch(console.error);
  }, [channels.length, fetchPage, hasMore, loadingMore, search]);

  const refresh = useCallback(() => {
    fetchPage({ q: search, offset: 0, append: false }).catch(console.error);
  }, [fetchPage, search]);

  const createChannel = useCallback(
    async (name) => {
      const { channel } = await api.createChannel(projectId, name);
      await fetchPage({ q: search, offset: 0, append: false });
      return channel;
    },
    [fetchPage, projectId, search],
  );

  const updateChannel = useCallback(
    async (channelId, body) => {
      const { channel } = await api.patchChannel(channelId, body);
      setChannels((prev) =>
        prev.map((c) => (c.id === channelId ? { ...c, ...channel, tasks: c.tasks } : c)),
      );
      setChannelsVersion((v) => v + 1);
      return channel;
    },
    [],
  );

  const archiveChannel = useCallback(
    async (channelId) => {
      await api.archiveChannel(channelId);
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
      setTotal((t) => Math.max(0, t - 1));
      setChannelsVersion((v) => v + 1);
      await fetchPage({ q: search, offset: 0, append: false });
      await fetchArchived();
    },
    [fetchArchived, fetchPage, search],
  );

  const deleteChannel = useCallback(
    async (channelId) => {
      await api.deleteChannel(channelId);
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
      setTotal((t) => Math.max(0, t - 1));
      setChannelsVersion((v) => v + 1);
      await fetchPage({ q: search, offset: 0, append: false });
      await fetchArchived();
    },
    [fetchArchived, fetchPage, search],
  );

  const restoreChannel = useCallback(
    async (channelId) => {
      await api.restoreChannel(channelId);
      setChannelsVersion((v) => v + 1);
      await fetchPage({ q: search, offset: 0, append: false });
      await fetchArchived();
    },
    [fetchArchived, fetchPage, search],
  );

  const value = useMemo(
    () => ({
      channels,
      archivedChannels,
      total,
      hasMore,
      search,
      loading,
      loadingMore,
      channelsVersion,
      refresh,
      searchChannels,
      loadMore,
      createChannel,
      updateChannel,
      archiveChannel,
      deleteChannel,
      restoreChannel,
    }),
    [
      channels,
      archivedChannels,
      total,
      hasMore,
      search,
      loading,
      loadingMore,
      channelsVersion,
      refresh,
      searchChannels,
      loadMore,
      createChannel,
      updateChannel,
      archiveChannel,
      deleteChannel,
      restoreChannel,
    ],
  );

  return <ChannelsContext.Provider value={value}>{children}</ChannelsContext.Provider>;
}

export function useChannels() {
  const ctx = useContext(ChannelsContext);
  if (!ctx) throw new Error("useChannels must be used within ChannelsProvider");
  return ctx;
}
