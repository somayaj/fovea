import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api } from "../api.js";
import MindMapEdge from "../components/MindMapEdge.jsx";
import {
  brainstormNodeFromIdea,
  brainstormNodeTypes,
} from "../components/BrainstormNodes.jsx";
import FocusOnNode from "../components/FocusOnNode.jsx";
import IdeaPanel from "../components/IdeaPanel.jsx";
import MindMapBackdrop from "../components/MindMapBackdrop.jsx";
import { useChannels } from "../context/ChannelsContext.jsx";
import FocusPageShell from "../components/FocusPageShell.jsx";
import { tw, cn } from "../lib/tw.js";
import { PageHeader, EmptyPanel, HeaderButton } from "../components/PageHeader.jsx";
import { IconBrainstorm, IconPlus } from "../components/icons.jsx";

const edgeTypes = { mindmap: MindMapEdge };

function scatterIdeas(ideas) {
  const cx = 420;
  const cy = 280;
  return ideas.map((idea, index) => {
    const hasPosition = Math.abs(idea.x ?? 0) > 8 || Math.abs(idea.y ?? 0) > 8;
    if (hasPosition) return idea;
    const angle = (Math.PI * 2 * index) / Math.max(ideas.length, 1) - Math.PI / 2;
    const radius = 100 + (index % 3) * 55;
    return {
      ...idea,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });
}

function toFlowGraph(ideas, edges, selectedId) {
  const ideaIds = new Set(ideas.map((n) => n.id));
  const flowNodes = ideas.map((idea) => brainstormNodeFromIdea(idea, selectedId));
  const flowEdges = edges
    .filter((edge) => ideaIds.has(edge.source_id) && ideaIds.has(edge.target_id))
    .map((edge, index) => ({
      id: edge.id,
      source: edge.source_id,
      target: edge.target_id,
      type: "mindmap",
      data: {
        branchIndex: index,
        active: selectedId === edge.source_id || selectedId === edge.target_id,
      },
    }));
  return { flowNodes, flowEdges };
}

export default function BrainstormView({ me }) {
  return (
    <ReactFlowProvider>
      <BrainstormCanvas me={me} />
    </ReactFlowProvider>
  );
}

function BrainstormCanvas({ me }) {
  const projectId = me.project?.id;
  const { screenToFlowPosition } = useReactFlow();
  const { channels, refresh: refreshChannels } = useChannels();

  const [ideas, setIdeas] = useState([]);
  const [rawEdges, setRawEdges] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [fitResetKey, setFitResetKey] = useState(0);

  useEffect(() => {
    const onRefit = () => setFitResetKey((key) => key + 1);
    window.addEventListener("fovea:refit-view", onRefit);
    return () => window.removeEventListener("fovea:refit-view", onRefit);
  }, []);

  const selected = useMemo(
    () => ideas.find((idea) => idea.id === selectedId) ?? null,
    [ideas, selectedId],
  );

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await api.ideas(projectId);
      const ideaNodes = scatterIdeas(data.ideas || []);
      setIdeas(ideaNodes);
      setRawEdges(data.edges || []);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  useEffect(() => {
    const { flowNodes, flowEdges } = toFlowGraph(ideas, rawEdges, selectedId);
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [ideas, rawEdges, selectedId, setNodes, setEdges]);

  const persistPosition = async (id, x, y) => {
    await api.patchNode(id, { x, y });
    setIdeas((prev) => prev.map((idea) => (idea.id === id ? { ...idea, x, y } : idea)));
  };

  const addIdea = async () => {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2 - 100,
      y: window.innerHeight / 2 - 40,
    });
    const created = await api.createNode({
      projectId,
      type: "idea",
      title: "New idea",
      x: position.x,
      y: position.y,
    });
    setSelectedId(created.node.id);
    await load();
  };

  const patchSelected = async (body) => {
    if (!selected) return;
    const { node } = await api.patchNode(selected.id, body);
    setIdeas((prev) => prev.map((idea) => (idea.id === node.id ? { ...idea, ...node } : idea)));
  };

  const promoteSelected = async ({ channelId }) => {
    if (!selected) return;
    await api.patchNode(selected.id, {
      promote: "task",
      priority: "p2",
      channelId,
    });
    setSelectedId(null);
    await refreshChannels();
    await load();
  };

  const deleteSelected = async () => {
    if (!selected) return;
    await api.deleteNode(selected.id);
    setSelectedId(null);
    await load();
  };

  const onConnect = useCallback(
    async (connection) => {
      if (!projectId || !connection.source || !connection.target) return;
      try {
        const { edge } = await api.createEdge({
          projectId,
          sourceId: connection.source,
          targetId: connection.target,
        });
        setRawEdges((prev) => [...prev, edge]);
        setEdges((prev) =>
          addEdge(
            {
              ...connection,
              id: edge.id,
              type: "mindmap",
              data: { branchIndex: prev.length, active: false },
            },
            prev,
          ),
        );
      } catch (err) {
        console.error(err);
      }
    },
    [projectId, setEdges],
  );

  const isEmpty = !loading && ideas.length === 0;

  return (
    <FocusPageShell fill className="flex min-h-0 flex-col overflow-hidden">
      <PageHeader
        eyebrow="Brainstorm"
        icon={<IconBrainstorm size={13} />}
        title="Ideas"
        description="A free-form space for rough thoughts. Promote to a task when ready."
        actions={
          <HeaderButton onClick={addIdea}>
            <IconPlus size={13} />
            Idea
          </HeaderButton>
        }
      />

      <div className="relative grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_320px]">
      <div className="flex min-h-0 min-w-0 flex-col">
        <div className="map-flow-canvas relative min-h-0 flex-1 bg-paper">
          <MindMapBackdrop />

          {loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-paper text-sm text-stone-500">
              Loading brainstorm…
            </div>
          ) : null}

          {isEmpty ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-paper p-6">
              <div className="max-w-sm rounded-xl border border-line/70 bg-surface p-8 shadow-sm">
                <EmptyPanel
                  icon={<IconBrainstorm size={22} />}
                  title="Start brainstorming"
                  description="Capture loose thoughts here. Drag to arrange and connect ideas."
                  action={
                    <button type="button" onClick={addIdea} className={tw.btn}>
                      <IconPlus size={14} />
                      Add your first idea
                    </button>
                  }
                />
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={brainstormNodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={(_event, node) => setSelectedId(node.id)}
              onPaneClick={() => setSelectedId(null)}
              onNodeDragStop={(_event, node) => {
                persistPosition(node.id, node.position.x, node.position.y).catch(console.error);
              }}
              onConnect={onConnect}
              nodesDraggable
              nodesConnectable
              elementsSelectable
              minZoom={0.25}
              maxZoom={1.25}
              className="sketch-map h-full w-full !bg-transparent"
            >
              <FocusOnNode
                nodeCount={nodes.length}
                columnCount={1}
                viewMode="brainstorm"
                layoutKey="brainstorm"
                resetKey={fitResetKey}
              />
              <Controls showInteractive={false} position="bottom-right" />
            </ReactFlow>
          )}
        </div>
      </div>

      <IdeaPanel
        idea={selected}
        channels={channels}
        onChange={patchSelected}
        onPromote={promoteSelected}
        onDelete={deleteSelected}
        onClose={() => setSelectedId(null)}
      />
    </div>
    </FocusPageShell>
  );
}
