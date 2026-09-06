function fontWeightFor(data) {
  if (data.isHub) return 700;
  if (data.priority === "p0") return 600;
  return 500;
}

function WordCloudNode({ data, selected }) {
  const isHub = data.isHub;
  const isIdea = data.type === "idea";
  const fontSize = data.fontSize || 18;

  return (
    <div className="relative flex items-center justify-center px-1">
      <p
        title={data.title}
        className={[
          "m-0 max-w-[240px] cursor-pointer text-center leading-tight transition-all duration-200 select-none",
          isHub ? "tracking-tight" : "",
          isIdea ? "italic opacity-80" : "",
          selected ? "underline decoration-2 underline-offset-4" : "hover:opacity-80",
        ].join(" ")}
        style={{
          fontSize,
          color: data.wordColor,
          fontWeight: fontWeightFor(data),
          textDecorationColor: selected ? data.wordColor : undefined,
        }}
      >
        {data.title}
      </p>
    </div>
  );
}

export function HubNode(props) {
  return <WordCloudNode {...props} />;
}

export function BranchNode(props) {
  return <WordCloudNode {...props} />;
}

export function LeafNode(props) {
  return <WordCloudNode {...props} />;
}

export const wordCloudNodeTypes = {
  hub: HubNode,
  branch: BranchNode,
  leaf: LeafNode,
};

export function wordCloudNodeFromTask(node, selectedId) {
  const tier = node.tier || "branch";
  const typeMap = { hub: "hub", branch: "branch", leaf: "leaf" };

  return {
    id: node.id,
    type: typeMap[tier] || "branch",
    position: { x: node.x, y: node.y },
    origin: [0.5, 0.5],
    draggable: false,
    selected: node.id === selectedId,
    zIndex: tier === "hub" ? 30 : node.id === selectedId ? 20 : 5,
    data: {
      ...node,
      type: node.type,
      title: node.title,
      priority: node.priority,
      fontSize: node.fontSize,
      wordColor: node.wordColor,
      rotation: node.rotation,
      isHub: node.isHub,
      branchColor: node.branchColor,
      tier,
    },
  };
}
