import { useEffect, useRef } from "react";
import { useNodesInitialized, useReactFlow } from "@xyflow/react";

function fitOptions({ nodeCount, columnCount, layoutKey, canvasWidth }) {
  const singleChannel = layoutKey !== "all";
  const manyColumns = columnCount > 5;
  const tallMap = nodeCount > 24;
  const narrow = canvasWidth > 0 && canvasWidth < 768;

  if (singleChannel) {
    return {
      padding: narrow ? 0.22 : 0.3,
      maxZoom: narrow ? 0.92 : 1.0,
      minZoom: 0.35,
      duration: 300,
    };
  }

  if (manyColumns || tallMap) {
    return {
      padding: narrow ? 0.1 : 0.14,
      maxZoom: narrow ? 0.72 : 0.82,
      minZoom: 0.12,
      duration: 300,
    };
  }

  return {
    padding: narrow ? 0.16 : 0.22,
    maxZoom: narrow ? 0.88 : 0.95,
    minZoom: 0.2,
    duration: 300,
  };
}

/** Fits the React Flow canvas after nodes are measured. */
export default function FocusOnNode({
  nodeCount,
  columnCount = 1,
  viewMode = "map",
  layoutKey = "all",
  canvasWidth = 0,
  resetKey = 0,
  skipFit = false,
}) {
  const { fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const lastFitKey = useRef("");

  useEffect(() => {
    if (skipFit || !nodesInitialized || !nodeCount) return;

    const fitKey = `${layoutKey}:${viewMode}:${nodeCount}:${columnCount}:${Math.round(canvasWidth)}:${resetKey}`;
    if (lastFitKey.current === fitKey) return;
    lastFitKey.current = fitKey;

    const timer = window.setTimeout(() => {
      fitView(
        fitOptions({
          nodeCount,
          columnCount,
          layoutKey,
          canvasWidth,
        }),
      );
    }, 80);

    return () => window.clearTimeout(timer);
  }, [skipFit, nodesInitialized, nodeCount, columnCount, layoutKey, viewMode, canvasWidth, resetKey, fitView]);

  return null;
}
