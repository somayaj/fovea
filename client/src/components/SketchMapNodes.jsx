import { Handle, Position } from "@xyflow/react";
import InstantPhoto from "./InstantPhoto.jsx";
import TaskPhoto from "./TaskPhoto.jsx";
import { PriorityBadge } from "./ui.jsx";
import TypePin from "./TypePin.jsx";
import { workstreamMonogram, workstreamTheme } from "../lib/content.js";
import { useMapSelection } from "../context/MapSelectionContext.jsx";
import { MAP_COLUMN_WIDTH, MAP_TASK_CARD_HEIGHT, MAP_WORKSTREAM_HEIGHT } from "../lib/treeLayout.js";
import { tw, cn } from "../lib/tw.js";

const HANDLE = "!h-1 !w-1 !border-0 !bg-transparent !opacity-0";

function taskFromNodeData(data) {
  return {
    id: data.id,
    title: data.title,
    notes: data.notes,
    type: data.type,
    priority: data.priority,
    image_url: data.image_url,
    has_custom_photo: data.has_custom_photo ?? data.hasCustomPhoto,
  };
}

function mapPolaroidClass(selected, { isDimmed, isFocusThrob, isWeekHighlight } = {}) {
  return cn(
    "sketch-map-polaroid",
    isFocusThrob && "sketch-box-focus-throb",
    isWeekHighlight && "sketch-box-week-highlight",
    isDimmed && "sketch-box-dimmed",
    selected && "task-photo-selected",
  );
}

function ChannelSummaryBox({ title, subtitle, selected, branchColor, isDimmed, isFocusThrob, isWeekHighlight }) {
  const theme = workstreamTheme(title);
  const monogram = workstreamMonogram(title);
  const accent = branchColor || theme.accent;
  const count = subtitle || "No tasks yet";

  return (
    <div
      className={cn(
        "sketch-workstream-card",
        isFocusThrob && "sketch-box-focus-throb",
        isWeekHighlight && "sketch-box-week-highlight",
        isDimmed && "sketch-box-dimmed",
        selected && "sketch-workstream-card-selected",
      )}
      style={{ "--ws-accent": accent }}
    >
      <div className="sketch-workstream-card-bar" aria-hidden="true" />
      <div className="sketch-workstream-card-body">
        <span className="sketch-workstream-watermark" aria-hidden="true">{monogram}</span>
        <span className="sketch-workstream-count">{count}</span>
        <div className="sketch-workstream-card-content">
          <p className="sketch-workstream-name">
            <span className="sketch-workstream-hash">#</span>
            {title}
          </p>
          <p className="sketch-workstream-tagline">{theme.tagline}</p>
        </div>
      </div>
    </div>
  );
}

function TaskCardBox({
  task,
  channelName,
  title,
  subtitle,
  selected,
  isDimmed,
  isFocusThrob,
  isWeekHighlight,
  weekRank,
  priority,
  recurring,
}) {
  return (
    <div className="relative w-[204px] shrink-0">
      {weekRank ? (
        <span className="sketch-week-rank" aria-hidden="true">{weekRank}</span>
      ) : null}
      {priority ? (
        <span className="absolute left-1 top-1 z-10">
          <PriorityBadge priority={priority} map />
        </span>
      ) : null}
      {recurring ? (
        <span
          className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-surface/90 text-[11px] font-semibold text-muted shadow-sm"
          title="Recurring task"
          aria-label="Recurring task"
        >
          ↻
        </span>
      ) : null}
      <TaskPhoto
        task={task || { id: title, title }}
        channelName={channelName}
        size="sm"
        showTitle
        meta={subtitle}
        selected={selected}
        className={mapPolaroidClass(selected, { isDimmed, isFocusThrob, isWeekHighlight })}
      />
    </div>
  );
}

function SketchBox({
  task,
  channelName,
  title,
  nodeType,
  selected,
  isHub,
  isRollup,
  large,
  subtitle,
  isSummary,
  isFocusThrob,
  isWeekHighlight,
  isDimmed,
  weekRank,
  priority,
  branchColor,
  recurring,
}) {
  if (isSummary) {
    return (
      <ChannelSummaryBox
        title={title}
        subtitle={subtitle}
        selected={selected}
        branchColor={branchColor}
        isDimmed={isDimmed}
        isFocusThrob={isFocusThrob}
        isWeekHighlight={isWeekHighlight}
      />
    );
  }

  const photoTask = task || { id: title, title, type: nodeType, priority };

  if ((nodeType === "task" || isHub) && !isRollup) {
    return (
      <TaskCardBox
        task={photoTask}
        channelName={channelName}
        title={title}
        priority={priority}
        subtitle={subtitle}
        selected={selected}
        isDimmed={isDimmed}
        isFocusThrob={isFocusThrob}
        isWeekHighlight={isWeekHighlight}
        weekRank={weekRank}
        recurring={recurring}
      />
    );
  }

  const type = isRollup ? null : nodeType || "task";

  return (
    <div
      className={[
        "sketch-box relative cursor-pointer text-left transition-all duration-200",
        large ? "min-w-[190px] max-w-[220px]" : "min-w-[150px] max-w-[190px]",
        isHub ? "sketch-box-hub px-4 py-3" : "px-3 py-2.5",
        isFocusThrob ? "sketch-box-focus-throb" : "",
        isWeekHighlight ? "sketch-box-week-highlight" : "",
        isDimmed ? "sketch-box-dimmed" : "",
        isRollup ? "sketch-box-rollup" : "",
        selected ? "sketch-box-selected" : "hover:shadow-md",
      ].join(" ")}
    >
      {weekRank ? (
        <span className="sketch-week-rank" aria-hidden="true">{weekRank}</span>
      ) : null}
      <div className="flex items-start gap-2.5">
        {type ? <TypePin type={type} size="sm" className="shrink-0 pt-0.5" /> : null}
        <div className="min-w-0">
          <p
            className={[
              "m-0 text-sm font-semibold leading-snug",
              large ? "text-lg text-stone-900" : isRollup ? "text-base text-stone-700" : "text-base text-stone-800",
            ].join(" ")}
          >
            {title}
          </p>
          {subtitle ? (
            <p className="m-0 mt-1 text-xs font-medium text-stone-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function useNodeVisualState(id, data) {
  const selectedId = useMapSelection();
  const selected = id === selectedId;
  const selectionActive = selectedId != null;
  const showWeekDecor = !selectionActive || selected;
  const isWeekHighlight = Boolean(data.isWeekHighlight);
  const isDimmed = Boolean(
    data.emphasizeWeek && !isWeekHighlight && !selected && !data.isWeekFocus,
  );

  return {
    selected,
    isWeekHighlight: showWeekDecor && isWeekHighlight && !data.isWeekFocus,
    isFocusThrob: showWeekDecor && Boolean(data.isWeekFocus),
    isDimmed,
    weekRank: data.emphasizeWeek && data.weekRank && showWeekDecor ? data.weekRank : null,
  };
}

function HubNode({ data, id }) {
  const { selected, isFocusThrob } = useNodeVisualState(id, data);
  return (
    <div className="sketch-hub-throb relative flex flex-col items-center">
      <span className="sketch-hub-glow" aria-hidden="true" />
      <div className="relative z-10">
        <SketchBox
          task={taskFromNodeData(data)}
          channelName={data.channelName}
          title={data.title}
          nodeType={data.type || "task"}
          selected={selected}
          isHub
          isFocusThrob={isFocusThrob}
          large
        />
        <p className={cn(tw.label, "mt-2 text-center text-stone-500")}>This week&apos;s focus</p>
      </div>
      <Handle type="target" position={Position.Bottom} className={HANDLE} id="b" />
    </div>
  );
}

function BranchNode({ data, id }) {
  const selectedId = useMapSelection();
  const { selected, isWeekHighlight, isFocusThrob, isDimmed } = useNodeVisualState(id, data);
  const isSummary = data.isChannelSummary;
  const taskCount = data.channelHint || null;
  const showFocusChannelWrap = isSummary && data.isFocusChannel && !selectedId;

  return (
    <div className={`sketch-column-wrap flex flex-col items-center${showFocusChannelWrap ? " sketch-channel-focus-wrap" : ""}`}>
      <Handle type="source" position={Position.Top} className={HANDLE} id="t" />
      <SketchBox
        title={data.title}
        nodeType="task"
        selected={selected}
        isSummary={isSummary}
        isFocusThrob={isFocusThrob}
        isWeekHighlight={isWeekHighlight}
        isDimmed={isDimmed}
        subtitle={isSummary ? taskCount : null}
        branchColor={data.branchColor || data.color}
      />
      <Handle type="target" position={Position.Bottom} className={HANDLE} id="b" />
    </div>
  );
}

function weekLeafSubtitle(data) {
  if (!data.emphasizeWeek || !data.isWeekHighlight || data.isChannelSummary) return null;
  if (data.isWeekFocus) return "This week's focus";
  return data.isWeekLinked ? "Linked this week" : "Related this week";
}

function LeafNode({ data, id }) {
  const { selected, isWeekHighlight, isFocusThrob, isDimmed, weekRank } = useNodeVisualState(id, data);

  return (
    <div
      className={cn(
        "flex w-[204px] shrink-0 flex-col items-stretch",
        selected && "relative z-20",
      )}
    >
      <Handle type="source" position={Position.Top} className={HANDLE} id="t" />
      <SketchBox
        task={taskFromNodeData(data)}
        channelName={data.channelName}
        title={data.title}
        nodeType="task"
        priority={data.priority}
        selected={selected}
        isFocusThrob={isFocusThrob}
        isWeekHighlight={isWeekHighlight}
        isDimmed={isDimmed}
        weekRank={weekRank}
        subtitle={weekLeafSubtitle(data)}
        recurring={Boolean(data.recurrence_series_id)}
        branchColor={data.branchColor}
      />
      <Handle type="target" position={Position.Bottom} className={HANDLE} id="b" />
    </div>
  );
}

function RollupNode({ data, id }) {
  const selectedId = useMapSelection();
  const selected = id === selectedId;
  const subtitle =
    data.rollupKind === "channel-tasks" || data.rollupKind === "tasks-more"
      ? "tap to view all"
      : "tap to explore";

  return (
    <div className="flex flex-col items-center">
      <Handle type="source" position={Position.Top} className={HANDLE} id="t" />
      <InstantPhoto
        caption={data.title}
        meta={subtitle}
        className={cn("sketch-map-polaroid sketch-map-rollup-polaroid", selected && "task-photo-selected")}
      >
        <div className="sketch-map-rollup-well flex h-full min-h-[100px] items-center justify-center">
          <span className="text-2xl font-light text-stone-400" aria-hidden="true">+</span>
        </div>
      </InstantPhoto>
      {data.tier === "branch" ? (
        <Handle type="target" position={Position.Bottom} className={HANDLE} id="b" />
      ) : null}
    </div>
  );
}

export const sketchMapNodeTypes = {
  hub: HubNode,
  branch: BranchNode,
  leaf: LeafNode,
  rollup: RollupNode,
};

export function sketchMapNodeFromTask(node, centerId, weekOptions = null, selectedId = null) {
  const opts =
    weekOptions && typeof weekOptions === "object" && !Array.isArray(weekOptions)
      ? weekOptions
      : { weekFocusId: weekOptions };
  const {
    weekFocusId = null,
    weekHighlightIds = null,
    weekRankById = null,
    weekLinkedIds = null,
    emphasizeWeek = false,
    focusChannelId = null,
  } = opts;

  const isHub = node.id === centerId;
  const isWeekFocus = Boolean(weekFocusId && node.id === weekFocusId);
  const isWeekLinked = Boolean(weekLinkedIds?.has(node.id));
  const weekRank = emphasizeWeek ? weekRankById?.get(node.id) ?? null : null;
  const isFocusChannel = Boolean(
    node.isChannelSummary && focusChannelId && node.summaryChannelId === focusChannelId,
  );
  const isWeekHighlight = Boolean(weekHighlightIds?.has(node.id) || (emphasizeWeek && isFocusChannel));
  const isWeekRelated = isWeekHighlight && !isWeekFocus;
  const tier = node.tier || (isHub ? "hub" : "branch");

  let type = "branch";
  if (isHub) type = "hub";
  else if (node.isRollup) type = "rollup";
  else if (tier === "leaf") type = "leaf";
  else type = "branch";

  const width = MAP_COLUMN_WIDTH;
  const height = node.isChannelSummary || (tier === "branch" && !node.isRollup)
    ? MAP_WORKSTREAM_HEIGHT
    : MAP_TASK_CARD_HEIGHT;

  return {
    id: node.id,
    type,
    position: { x: node.x, y: node.y },
    width,
    height,
    origin: [0.5, 0],
    draggable: false,
    zIndex: node.id === selectedId ? 40 : isHub ? 30 : node.isRollup ? 8 : 10,
    data: {
      ...node,
      title: node.title,
      type: node.type,
      priority: node.priority,
      tier,
      channelHint: node.channelHint,
      groupSize: node.groupSize,
      isRollup: node.isRollup,
      rollupKind: node.rollupKind,
      rollupCount: node.rollupCount,
      rollupChannelId: node.rollupChannelId,
      rollupChannelPage: node.rollupChannelPage,
      isChannelSummary: node.isChannelSummary,
      summaryChannelId: node.summaryChannelId,
      summaryChannelLabel: node.summaryChannelLabel,
      isFocusChannel,
      isWeekFocus,
      isWeekHighlight,
      isWeekRelated,
      isWeekLinked,
      weekRank,
      emphasizeWeek,
      branchColor: node.branchColor || node.color,
    },
  };
}
