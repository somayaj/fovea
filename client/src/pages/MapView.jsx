import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api } from "../api.js";
import SketchMapEdge from "../components/SketchMapEdge.jsx";
import { sketchMapNodeFromTask, sketchMapNodeTypes } from "../components/SketchMapNodes.jsx";
import FocusOnNode from "../components/FocusOnNode.jsx";
import PanToSelected from "../components/PanToSelected.jsx";
import MapGuide from "../components/MapGuide.jsx";
import MapSearch from "../components/MapSearch.jsx";
import MindMapBackdrop from "../components/MindMapBackdrop.jsx";
import PriorityBoard from "../components/PriorityBoard.jsx";
import {
  isRollupId,
  scopeOverview,
} from "../lib/mapRollup.js";
import { treeLayout, MAP_COLUMN_WIDTH } from "../lib/treeLayout.js";
import { buildWeekTaskOrder } from "../lib/weekOrder.js";
import NodePanel from "../components/NodePanel.jsx";
import TaskComposer from "../components/TaskComposer.jsx";
import { IMAGES } from "../lib/images.js";
import { useChannels } from "../context/ChannelsContext.jsx";
import { MapSelectionContext } from "../context/MapSelectionContext.jsx";
import { useViewportWidth } from "../hooks/useViewportWidth.js";
import FocusPageShell from "../components/FocusPageShell.jsx";
import { tw, cn } from "../lib/tw.js";
import { PageHeader, SegmentedControl, HeaderButton, HeaderOutlineButton } from "../components/PageHeader.jsx";
import {
  IconBoard,
  IconChevronLeft,
  IconFocus,
  IconHash,
  IconLayers,
  IconList,
  IconMap,
  IconPlus,
} from "../components/icons.jsx";

const edgeTypes = { sketch: SketchMapEdge };

const VIEW_MODES = [
  { id: "map", label: "Map", icon: <IconMap size={13} /> },
  { id: "week", label: "Week", icon: <IconFocus size={13} /> },
  { id: "board", label: "Board", icon: <IconBoard size={13} /> },
];

const VIEW_COPY = {
  board: "A simple list of everything, sorted by priority.",
};

function toFlowGraph(
  laidOut,
  selectedId,
  { weekFocusId, weekHighlightIds, weekRankById, weekLinkedIds, emphasizeWeek, focusChannelId } = {},
) {
  const flowNodes = laidOut.map((node) =>
    sketchMapNodeFromTask(node, null, {
      weekFocusId,
      weekHighlightIds,
      weekRankById,
      weekLinkedIds,
      emphasizeWeek,
      focusChannelId,
    }, selectedId),
  );

  const flowEdges = laidOut
    .filter((n) => n.parentId)
    .map((n) => {
      const weekHighlight = Boolean(!selectedId && weekHighlightIds?.has(n.id));
      return {
        id: `e-${n.id}-${n.parentId}`,
        source: n.id,
        target: n.parentId,
        type: "sketch",
        data: {
          active: selectedId === n.id,
          emphasizeWeek,
          weekHighlight,
          dimmed: emphasizeWeek && !weekHighlight && !selectedId,
          branchColor: n.branchColor,
        },
      };
    });

  return { flowNodes, flowEdges };
}

function channelUrlForTask(task) {
  return task.channel_id ? `/map?channel=${task.channel_id}` : "/map?channel=unsorted";
}

function taskOnCurrentChannel(task, filterChannel) {
  if (!filterChannel) return false;
  return (
    (task.channel_id && filterChannel === task.channel_id) ||
    (!task.channel_id && filterChannel === "unsorted")
  );
}

function channelNameFor(channels, channelId) {
  if (!channelId) return "Unsorted";
  return channels.find((c) => c.id === channelId)?.name || "Channel";
}

export default function MapView({ me }) {
  return (
    <ReactFlowProvider>
      <MapCanvas me={me} />
    </ReactFlowProvider>
  );
}

function MapCanvas({ me }) {
  const projectId = me.project?.id;
  const { screenToFlowPosition } = useReactFlow();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterChannel = searchParams.get("channel");
  const { channels, total: channelTotal, channelsVersion, refresh: refreshChannels } = useChannels();
  const viewportWidth = useViewportWidth();
  const [activeChannelMeta, setActiveChannelMeta] = useState(null);
  const [channelPage, setChannelPage] = useState(0);
  const [taskPage, setTaskPage] = useState(0);
  const [channelPagination, setChannelPagination] = useState(null);
  const [taskPagination, setTaskPagination] = useState(null);
  const [treeNodes, setTreeNodes] = useState([]);

  const activeChannel = useMemo(() => {
    if (!filterChannel) return null;
    return (
      channels.find((c) => c.id === filterChannel) ||
      activeChannelMeta ||
      null
    );
  }, [channels, filterChannel, activeChannelMeta]);

  const layoutChannels = useMemo(
    () =>
      treeNodes
        .filter((n) => n.isChannelSummary)
        .map((n) => ({
          id: n.summaryChannelId,
          name: n.summaryChannelLabel || n.title,
          archived: 0,
        })),
    [treeNodes],
  );
  const [totalTasks, setTotalTasks] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [boardNodes, setBoardNodes] = useState([]);
  const [boardTotal, setBoardTotal] = useState(0);
  const [boardHasMore, setBoardHasMore] = useState(false);
  const [boardLoadingMore, setBoardLoadingMore] = useState(false);
  const [boardSearchQuery, setBoardSearchQuery] = useState("");
  const [boardSearchResults, setBoardSearchResults] = useState([]);
  const [boardSearchLoading, setBoardSearchLoading] = useState(false);
  const boardLoadMoreRef = useRef(null);
  const BOARD_PAGE_SIZE = 50;
  const [selectedId, setSelectedId] = useState(null);
  const [pinnedNode, setPinnedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [showMapGuide, setShowMapGuide] = useState(
    () => localStorage.getItem("fovea.mapGuide.dismissed") !== "1",
  );
  const [viewMode, setViewMode] = useState("map");
  const [week, setWeek] = useState(null);
  const [mapScope, setMapScope] = useState(scopeOverview());

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const canvasRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [fitResetKey, setFitResetKey] = useState(0);
  const prevChannelRef = useRef(filterChannel);
  const searchPendingRef = useRef(null);
  const pendingTaskPageRef = useRef(null);
  const boardViewPreserveRef = useRef(false);
  const weekViewPreserveRef = useRef(false);
  const [focusTargetId, setFocusTargetId] = useState(null);

  const bumpFitView = useCallback(() => {
    setFitResetKey((key) => key + 1);
  }, []);

  const resetMapView = useCallback(() => {
    if (filterChannel) navigate("/map");
    setMapScope(scopeOverview());
    setChannelPage(0);
    setTaskPage(0);
    setSelectedId(null);
    setPinnedNode(null);
    setViewMode("map");
    bumpFitView();
  }, [filterChannel, navigate, bumpFitView]);

  useEffect(() => {
    const onRefit = () => bumpFitView();
    const onReset = () => resetMapView();
    window.addEventListener("fovea:refit-view", onRefit);
    window.addEventListener("fovea:reset-map", onReset);
    return () => {
      window.removeEventListener("fovea:refit-view", onRefit);
      window.removeEventListener("fovea:reset-map", onReset);
    };
  }, [bumpFitView, resetMapView]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "]" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      e.preventDefault();
      resetMapView();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resetMapView]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const update = () => setCanvasWidth(el.clientWidth || 0);
    update();

    const observer = new ResizeObserver(() => update());
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const selected = useMemo(() => {
    if (selectedId && !isRollupId(selectedId)) {
      return (
        treeNodes.find((n) => n.id === selectedId) ||
        boardNodes.find((n) => n.id === selectedId) ||
        pinnedNode
      );
    }
    return pinnedNode;
  }, [treeNodes, boardNodes, selectedId, pinnedNode]);

  const channelCount = useMemo(
    () => treeNodes.filter((n) => n.isChannelSummary).length,
    [treeNodes],
  );

  const weekFocusId = week?.focus?.id ?? null;
  const { orderedIds: weekOrderIds, rankById: weekRankById, linkedIds: weekLinkedIds } = useMemo(
    () => buildWeekTaskOrder(week),
    [week],
  );
  const weekHighlightIds = useMemo(() => new Set(weekOrderIds), [weekOrderIds]);

  const mapHint = activeChannel
    ? taskPagination
      ? `${totalTasks.toLocaleString()} tasks in #${activeChannel.name} · showing ${visibleCount.toLocaleString()} on this page.`
      : `${totalTasks.toLocaleString()} tasks in #${activeChannel.name}.`
    : channelPagination
      ? `${totalTasks.toLocaleString()} tasks across ${channelPagination.total.toLocaleString()} workstreams.`
      : channelCount > 0
        ? `${totalTasks.toLocaleString()} tasks across ${channelCount} workstreams on this page.`
        : "Add tasks and they'll show up under their workstream.";

  const weekHint = weekFocusId
    ? `${weekHighlightIds.size} task${weekHighlightIds.size === 1 ? "" : "s"} highlighted for this week's focus.`
    : "No week focus yet — add a P0/P1 task or something due this week.";

  const taskMatchesBoardScope = useCallback(
    (task) =>
      !filterChannel ||
      (task.channel_id && filterChannel === task.channel_id) ||
      (!task.channel_id && filterChannel === "unsorted"),
    [filterChannel],
  );

  const handleSearchSelect = useCallback(
    (task) => {
      setPinnedNode(task);
      setSelectedId(task.id);
      setFocusTargetId(task.id);
      searchPendingRef.current = task.id;

      if (viewMode === "board") {
        if (!boardNodes.some((n) => n.id === task.id)) {
          setBoardNodes((prev) => (prev.some((n) => n.id === task.id) ? prev : [task, ...prev]));
        }
        if (!taskMatchesBoardScope(task)) {
          boardViewPreserveRef.current = true;
          navigate(channelUrlForTask(task));
        } else {
          searchPendingRef.current = null;
        }
        return;
      }

      const onChannel = taskOnCurrentChannel(task, filterChannel);
      const visibleOnMap = treeNodes.some((n) => n.id === task.id);

      if (onChannel && visibleOnMap) {
        searchPendingRef.current = null;
        return;
      }

      const targetPage = task.mapTaskPage ?? 0;

      if (!onChannel) {
        pendingTaskPageRef.current = targetPage;
        if (viewMode === "week") weekViewPreserveRef.current = true;
        navigate(channelUrlForTask(task));
        return;
      }

      setTaskPage(targetPage);
    },
    [viewMode, boardNodes, taskMatchesBoardScope, navigate, treeNodes, filterChannel],
  );
  const isEmpty =
    !loading &&
    totalTasks === 0 &&
    !filterChannel &&
    (channelPagination?.total ?? channelTotal) === 0;
  const isBoard = viewMode === "board";
  const isWeek = viewMode === "week";
  const boardSearchActive = isBoard && boardSearchQuery.trim().length >= 2;
  const displayBoardNodes = boardSearchActive ? boardSearchResults : boardNodes;

  const handleBoardSearchQuery = useCallback((query) => {
    setBoardSearchQuery(query);
  }, []);

  const handleBoardSelect = useCallback(
    (id) => {
      setSelectedId(id);
      const node = displayBoardNodes.find((n) => n.id === id);
      if (node) setPinnedNode(node);
    },
    [displayBoardNodes],
  );
  const scopedTreeNodes = useMemo(() => {
    if (!filterChannel) return treeNodes;
    const summaryId =
      filterChannel === "unsorted" ? "__channel____none__" : `__channel__${filterChannel}`;
    return treeNodes.filter(
      (n) =>
        (n.isChannelSummary &&
          (filterChannel === "unsorted"
            ? n.summaryChannelId == null
            : n.summaryChannelId === filterChannel)) ||
        (n.tier === "leaf" &&
          (filterChannel === "unsorted"
            ? !n.channel_id
            : n.channel_id === filterChannel || n.parentId === summaryId)),
    );
  }, [treeNodes, filterChannel]);

  const rollupLayout = useMemo(() => {
    if (isBoard) return { laidOut: [] };
    const sourceNodes = scopedTreeNodes.length ? scopedTreeNodes : treeNodes;
    if (!sourceNodes.length && !layoutChannels.length) return { laidOut: [] };
    const layoutWidth = canvasWidth || viewportWidth;
    const laidOut = treeLayout(null, sourceNodes, Math.max(layoutWidth / 2, MAP_COLUMN_WIDTH), 60, {
      flat: true,
      weekOrderIds: isWeek ? weekOrderIds : null,
      channels: layoutChannels,
      filterChannelId: filterChannel || null,
      viewportWidth: layoutWidth,
    });
    return { laidOut };
  }, [scopedTreeNodes, treeNodes, layoutChannels, filterChannel, isBoard, isWeek, weekOrderIds, viewportWidth, canvasWidth]);

  const loadWeek = useCallback(async () => {
    try {
      const data = await api.week();
      setWeek(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadMapView = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const viewData = await api.mapView(projectId, {
        scope: mapScope,
        channel: filterChannel || undefined,
        channelPage,
        taskPage,
      });
      setTreeNodes(viewData.treeNodes || []);
      setTotalTasks(viewData.totalTasks || 0);
      setVisibleCount(viewData.visibleCount || 0);
      setChannelPagination(viewData.channelPagination || null);
      setTaskPagination(viewData.taskPagination || null);
      setActiveChannelMeta(viewData.activeChannel || null);
      loadWeek().catch(console.error);
    } catch (err) {
      console.error(err);
      const message =
        err.status === 404
          ? "Server is out of date — stop it and run npm run dev again from the project root."
          : err.message || "Could not load map";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId, mapScope, filterChannel, channelPage, taskPage, loadWeek]);

  const loadBoard = useCallback(
    async ({ append = false } = {}) => {
      if (!projectId) return;
      if (append) setBoardLoadingMore(true);
      try {
        const offset = append ? boardNodes.length : 0;
        const data = await api.tasks(projectId, {
          limit: BOARD_PAGE_SIZE,
          offset,
          channel: filterChannel || undefined,
        });
        const next = data.nodes || [];
        setBoardNodes((prev) => (append ? [...prev, ...next] : next));
        setBoardTotal(data.total || 0);
        setBoardHasMore(Boolean(data.hasMore));
      } finally {
        setBoardLoadingMore(false);
      }
    },
    [projectId, filterChannel, boardNodes.length],
  );

  useEffect(() => {
    if (!isBoard) {
      setBoardSearchQuery("");
      setBoardSearchResults([]);
      setBoardSearchLoading(false);
      return;
    }
    if (!projectId || boardSearchQuery.trim().length < 2) {
      setBoardSearchResults([]);
      setBoardSearchLoading(false);
      return;
    }
    setBoardSearchLoading(true);
    const timer = window.setTimeout(() => {
      api
        .search(projectId, boardSearchQuery.trim(), { limit: 30 })
        .then((data) => setBoardSearchResults(data.results || []))
        .catch(() => setBoardSearchResults([]))
        .finally(() => setBoardSearchLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [isBoard, projectId, boardSearchQuery]);

  useEffect(() => {
    if (!isBoard || boardSearchActive || !boardHasMore || boardLoadingMore) return;
    const el = boardLoadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadBoard({ append: true }).catch(console.error);
      },
      { rootMargin: "240px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isBoard, boardSearchActive, boardHasMore, boardLoadingMore, loadBoard]);

  useEffect(() => {
    if (isBoard) {
      loadBoard({ append: false }).catch(console.error);
      return;
    }
    loadMapView().catch(console.error);
  }, [isBoard, loadMapView, loadBoard, channelsVersion]);

  useEffect(() => {
    setMapScope(scopeOverview());
    setChannelPage(0);
    const pendingId = searchPendingRef.current;
    if (!pendingId) {
      setTaskPage(0);
    }
    if (filterChannel) {
      if (!boardViewPreserveRef.current && !weekViewPreserveRef.current) {
        setViewMode("map");
      }
      boardViewPreserveRef.current = false;
      weekViewPreserveRef.current = false;
      if (!pendingId) {
        setSelectedId(null);
        setPinnedNode(null);
      }
    } else {
      setActiveChannelMeta(null);
      if (!pendingId) {
        setPinnedNode(null);
      }
    }
  }, [filterChannel]);

  useEffect(() => {
    if (pendingTaskPageRef.current == null || !searchPendingRef.current) return;
    if (!filterChannel) return;
    setTaskPage(pendingTaskPageRef.current);
    pendingTaskPageRef.current = null;
  }, [filterChannel]);

  useEffect(() => {
    if (prevChannelRef.current && !filterChannel) {
      bumpFitView();
    }
    prevChannelRef.current = filterChannel;
  }, [filterChannel, bumpFitView]);

  useEffect(() => {
    const pendingId = searchPendingRef.current;
    if (!pendingId) return;
    const onMap = treeNodes.some((n) => n.id === pendingId);
    const onBoard = boardNodes.some((n) => n.id === pendingId);
    if (!onMap && !onBoard) return;
    setSelectedId(pendingId);
    setFocusTargetId(pendingId);
    searchPendingRef.current = null;
  }, [treeNodes, boardNodes]);

  const handleRollupClick = useCallback((data) => {
    setSelectedId(null);
    if (data?.rollupKind === "channels" && data.rollupChannelPage != null) {
      setChannelPage(data.rollupChannelPage);
      return;
    }
    if (data?.rollupKind === "channel-tasks") {
      if (data.rollupChannelId) {
        navigate(`/map?channel=${data.rollupChannelId}`);
      } else {
        navigate("/map?channel=unsorted");
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (isBoard) return;

    const { laidOut } = rollupLayout;
    if (!laidOut.length) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { flowNodes, flowEdges } = toFlowGraph(laidOut, selectedId, {
      weekFocusId,
      weekHighlightIds,
      weekRankById,
      weekLinkedIds,
      emphasizeWeek: isWeek,
      focusChannelId: week?.focus?.channel_id ?? null,
    });
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [rollupLayout, isBoard, isWeek, selectedId, weekFocusId, weekHighlightIds, weekRankById, weekLinkedIds, week?.focus?.channel_id, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_e, node) => {
      if (node.data?.isRollup) {
        handleRollupClick(node.data);
        return;
      }
      if (node.data?.isChannelSummary) {
        const channelId = node.data.summaryChannelId;
        navigate(channelId ? `/map?channel=${channelId}` : "/map?channel=unsorted");
        return;
      }
      setSelectedId(node.id);
      setPinnedNode(null);
    },
    [handleRollupClick, navigate],
  );

  const addTask = async ({ title, priority, channelId, dueAt, estimateHours, recurrence }) => {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2 - 140,
      y: window.innerHeight / 2 - 80,
    });
    const created = await api.createNode({
      projectId,
      type: "task",
      title,
      priority,
      channelId: channelId || filterChannel || null,
      dueAt: dueAt || null,
      estimateHours,
      recurrence,
      x: position.x,
      y: position.y,
    });
    setSelectedId(created.node?.id ?? created.nodes?.[0]?.id);
    setShowComposer(false);
    await refreshChannels();
    if (isBoard) await loadBoard({ append: false });
    else await loadMapView();
  };

  const patchSelected = async (body) => {
    if (!selected) return;
    const { node } = await api.patchNode(selected.id, body);
    setTreeNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, ...node } : n)));
    await refreshChannels();
    if (isBoard) await loadBoard({ append: false });
    else await loadMapView();
  };

  return (
    <MapSelectionContext.Provider value={selectedId}>
    <FocusPageShell fill className="flex min-h-0 flex-col overflow-hidden">
      <PageHeader
        eyebrow={activeChannel ? "Workstream" : "Tasks"}
        icon={activeChannel ? <IconHash size={13} /> : <IconList size={13} />}
        title={activeChannel ? activeChannel.name : "All tasks"}
        description={isBoard ? VIEW_COPY.board : isWeek ? weekHint : mapHint}
        actions={
          activeChannel ? (
            <HeaderOutlineButton onClick={() => navigate("/map")}>
              <IconChevronLeft size={13} />
              All workstreams
            </HeaderOutlineButton>
          ) : null
        }
        toolbar={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <MapSearch
              key={viewMode}
              projectId={projectId}
              onSelect={handleSearchSelect}
              filterOnly={isBoard}
              onQueryChange={handleBoardSearchQuery}
              placeholder={isBoard ? "Filter tasks…" : "Search tasks…"}
            />
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl value={viewMode} onChange={setViewMode} options={VIEW_MODES} />
              {!isBoard ? (
                <HeaderOutlineButton
                  onClick={resetMapView}
                  title="Show all tasks and reset view (])"
                >
                  <IconLayers size={13} />
                  Reset view
                </HeaderOutlineButton>
              ) : null}
              <HeaderButton onClick={() => setShowComposer((v) => !v)}>
                <IconPlus size={13} />
                Task
              </HeaderButton>
            </div>
          </div>
        }
      />

      {showComposer ? (
        <div className="shrink-0 border-b border-line/70 bg-accent-soft/40 px-4 py-4 md:px-8">
          <TaskComposer
            projectId={projectId}
            channels={channels}
            defaultChannelId={filterChannel || ""}
            onSubmit={addTask}
            compact
          />
        </div>
      ) : null}

      <div className="relative grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_320px]">
      <div className="flex min-h-0 min-w-0 flex-col">
        <div ref={canvasRef} className="map-flow-canvas relative min-h-0 flex-1 bg-paper">
          {!isBoard ? <MindMapBackdrop /> : null}

          {loadError ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-paper p-6">
              <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                <h2 className="text-lg font-bold text-red-900">Map failed to load</h2>
                <p className="mt-2 text-sm text-red-800">{loadError}</p>
                <button
                  type="button"
                  onClick={() => loadMapView().catch(console.error)}
                  className={cn(tw.btn, "mt-4")}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-paper text-sm text-muted">
              Loading your map…
            </div>
          ) : null}

          {isEmpty ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
              <div className="max-w-md overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-sm">
                <img
                  src={IMAGES.allTasksInstant}
                  alt="All tasks as scattered instant photos"
                  className="h-48 w-full object-cover"
                />
                <div className="p-8 text-center">
                  <h2 className="text-xl font-semibold text-brand">Start your task map</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Every task is an instant photo — add one and watch your map grow.
                  </p>
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowComposer(true)}
                      className={tw.btn}
                    >
                      Add your first task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {isBoard && !isEmpty ? (
            <>
              {boardSearchActive ? (
                <p className="border-b border-line/70 bg-accent-soft/35 px-5 py-2 text-xs text-muted">
                  {boardSearchLoading
                    ? "Searching tasks…"
                    : `${displayBoardNodes.length.toLocaleString()} matching task${displayBoardNodes.length === 1 ? "" : "s"}.`}
                </p>
              ) : boardTotal > boardNodes.length ? (
                <p className="border-b border-line/70 bg-accent-soft/50 px-5 py-2 text-xs text-brand">
                  Showing {boardNodes.length.toLocaleString()} of {boardTotal.toLocaleString()} tasks by priority.
                </p>
              ) : null}
              <PriorityBoard
                nodes={displayBoardNodes}
                channels={channels}
                centerId={null}
                selectedId={selectedId}
                onSelect={handleBoardSelect}
                loadMoreRef={boardLoadMoreRef}
                loadingMore={boardLoadingMore}
                hasMore={!boardSearchActive && boardHasMore}
                emptyLabel={
                  boardSearchActive && !boardSearchLoading
                    ? "No tasks match your search."
                    : null
                }
              />
            </>
          ) : null}

          {(!isBoard && !isEmpty && !loading && rollupLayout.laidOut.length === 0) ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
              <div className="max-w-md rounded-2xl border border-line/70 bg-surface p-8 text-center shadow-sm">
                <h2 className="text-lg font-semibold text-brand">Couldn&apos;t lay out the map</h2>
                <p className="mt-2 text-sm text-muted">
                  Your tasks are here, but the view didn&apos;t render. Try refreshing or switching to Board view.
                </p>
                <button
                  type="button"
                  onClick={() => loadMapView().catch(console.error)}
                  className={cn(tw.btn, "mt-6")}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : null}

          {(!isBoard && !isEmpty && rollupLayout.laidOut.length > 0) ? (
            <ReactFlow
              key={filterChannel || "all"}
              nodes={nodes}
              edges={edges}
              nodeTypes={sketchMapNodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              onPaneClick={() => {
                setSelectedId(null);
                setPinnedNode(null);
              }}
              nodesDraggable={false}
              nodesConnectable={false}
              nodesFocusable={false}
              elementsSelectable={false}
              autoPanOnNodeFocus={false}
              elevateNodesOnSelect={false}
              onlyRenderVisibleElements
              fitView
              fitViewOptions={{ padding: 0.22, maxZoom: 0.95, minZoom: 0.15 }}
              minZoom={0.15}
              maxZoom={1.25}
              className="sketch-map h-full w-full !bg-transparent"
            >
              <FocusOnNode
                nodeCount={nodes.length}
                columnCount={layoutChannels.length || (filterChannel ? 1 : 0)}
                viewMode={viewMode}
                layoutKey={filterChannel || "all"}
                canvasWidth={canvasWidth}
                resetKey={fitResetKey}
                skipFit={Boolean(focusTargetId)}
              />
              <PanToSelected
                targetId={focusTargetId}
                nodes={nodes}
                onDone={() => setFocusTargetId(null)}
              />
              <Controls showInteractive={false} position="bottom-right" />
            </ReactFlow>
          ) : null}

          {!isBoard && !isEmpty && !loading && filterChannel && rollupLayout.laidOut.length === 0 ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
              <div className="max-w-md border border-stone-200 bg-white p-8 text-center">
                <p className={tw.label}>Workstream</p>
                <h2 className="mt-2 font-display text-2xl font-medium text-stone-900">
                  {activeChannel ? `#${activeChannel.name}` : "Channel"}
                </h2>
                <p className="mt-3 text-sm text-stone-500">No tasks in this workstream yet.</p>
                <button
                  type="button"
                  onClick={() => setShowComposer(true)}
                  className={cn(tw.btn, "mt-6")}
                >
                  Add a task
                </button>
              </div>
            </div>
          ) : null}

          {!isBoard && filterChannel && taskPagination && (taskPagination.page > 0 || taskPagination.hasMore) ? (
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {taskPagination.page > 0 ? (
                <button
                  type="button"
                  onClick={() => setTaskPage((p) => Math.max(0, p - 1))}
                  className={cn(tw.btnOutlineSm, "bg-white shadow-sm")}
                >
                  Previous tasks
                </button>
              ) : null}
              {taskPagination.hasMore ? (
                <button
                  type="button"
                  onClick={() => setTaskPage((p) => p + 1)}
                  className={cn(tw.btnOutlineSm, "bg-white shadow-sm")}
                >
                  More tasks
                </button>
              ) : null}
            </div>
          ) : null}

          {!isBoard && !filterChannel && channelPagination?.hasMore ? (
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {channelPagination.page > 0 ? (
                <button
                  type="button"
                  onClick={() => setChannelPage((p) => Math.max(0, p - 1))}
                  className={cn(tw.btnOutlineSm, "bg-white shadow-sm")}
                >
                  Previous workstreams
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setChannelPage((p) => p + 1)}
                className={cn(tw.btnOutlineSm, "bg-white shadow-sm")}
              >
                More workstreams
              </button>
            </div>
          ) : null}

          {!isEmpty && totalTasks < 4 && showMapGuide ? (
            <MapGuide
              onAddTask={() => setShowComposer(true)}
              onDismiss={() => {
                localStorage.setItem("fovea.mapGuide.dismissed", "1");
                setShowMapGuide(false);
              }}
            />
          ) : null}
        </div>
      </div>

      <NodePanel
        node={selected}
        projectId={projectId}
        channels={channels}
        weekFocusId={week?.focus?.id}
        weekFocusPinned={week?.focusPinned}
        onWeekFocusChange={loadWeek}
        onChange={patchSelected}
        onClose={() => {
          setSelectedId(null);
          setPinnedNode(null);
        }}
        onDelete={async () => {
          if (!selected) return;
          await api.deleteNode(selected.id);
          setSelectedId(null);
          await refreshChannels();
          if (isBoard) await loadBoard({ append: false });
          else await loadMapView();
        }}
        onSeriesDeleted={async () => {
          setSelectedId(null);
          await refreshChannels();
          if (isBoard) await loadBoard({ append: false });
          else await loadMapView();
        }}
      />
    </div>
    </FocusPageShell>
    </MapSelectionContext.Provider>
  );
}
