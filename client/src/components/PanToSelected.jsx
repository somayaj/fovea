import { useEffect } from "react";
import { useNodesInitialized, useReactFlow } from "@xyflow/react";
import { MAP_COLUMN_WIDTH, MAP_TASK_CARD_HEIGHT } from "../lib/treeLayout.js";

/** Pans the map canvas to a selected node once it exists in the flow graph. */
export default function PanToSelected({ targetId, nodes, onDone }) {
  const { setCenter } = useReactFlow();
  const nodesInitialized = useNodesInitialized();

  useEffect(() => {
    if (!targetId || !nodesInitialized) return;
    const flowNode = nodes.find((node) => node.id === targetId);
    if (!flowNode) return;

    const timer = window.setTimeout(() => {
      const width = flowNode.measured?.width ?? flowNode.width ?? MAP_COLUMN_WIDTH;
      const height = flowNode.measured?.height ?? flowNode.height ?? MAP_TASK_CARD_HEIGHT;
      const x = flowNode.position.x + width / 2;
      const y = flowNode.position.y + height / 2;
      setCenter(x, y, { zoom: 0.95, duration: 350 });
      onDone?.();
    }, 120);

    return () => window.clearTimeout(timer);
  }, [targetId, nodesInitialized, nodes, setCenter, onDone]);

  return null;
}
