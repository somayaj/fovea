export default function MapBreadcrumb({ scope, totalTasks, visibleCount, onNavigate }) {
  const crumbs = [];

  if (scope.type === "overview") {
    crumbs.push({ id: "overview", label: "Overview", scope });
  } else {
    crumbs.push({ id: "root", label: "All tasks", scope: { type: "root", channelPage: 0 } });
  }

  if (scope.type === "channel") {
    crumbs.push({
      id: "channel",
      label: scope.label || "Workstream",
      scope,
    });
  } else if (scope.type === "root" && scope.channelPage > 0) {
    crumbs.push({
      id: "page",
      label: `Page ${scope.channelPage + 1}`,
      scope,
    });
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      {crumbs.map((crumb, i) => (
        <span key={crumb.id} className="flex items-center gap-2">
          {i > 0 ? <span className="text-stone-300">/</span> : null}
          {i < crumbs.length - 1 ? (
            <button
              type="button"
              onClick={() => onNavigate(crumb.scope)}
              className="font-semibold text-brand hover:underline"
            >
              {crumb.label}
            </button>
          ) : (
            <span className="font-semibold text-stone-700">{crumb.label}</span>
          )}
        </span>
      ))}
      {totalTasks > visibleCount && scope.type !== "overview" ? (
        <span className="text-stone-400">
          · showing {visibleCount} of {totalTasks.toLocaleString()}
        </span>
      ) : totalTasks > 0 ? (
        <span className="text-stone-400">· {totalTasks.toLocaleString()} tasks</span>
      ) : null}
    </div>
  );
}
