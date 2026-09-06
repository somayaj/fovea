import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../api.js";
import { typeLabel } from "../lib/content.js";
import { tw, cn } from "../lib/tw.js";

export default function MapSearch({
  projectId,
  onSelect,
  onQueryChange,
  filterOnly = false,
  placeholder = "Search tasks…",
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  const updateMenuPosition = () => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 200,
    });
  };

  useLayoutEffect(() => {
    if (filterOnly || !open || query.trim().length < 2) {
      setMenuStyle(null);
      return;
    }
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [filterOnly, open, query, results.length, loading, error]);

  useEffect(() => {
    onQueryChange?.(query);
  }, [query, onQueryChange]);

  useEffect(() => {
    if (filterOnly || !projectId || query.trim().length < 2) {
      if (!filterOnly) {
        setResults([]);
        setLoading(false);
        setError(null);
        setOpen(false);
      }
      return;
    }

    setOpen(true);
    setLoading(true);
    setError(null);
    const timer = window.setTimeout(() => {
      api
        .search(projectId, query.trim())
        .then((data) => {
          setResults(data.results || []);
          setOpen(true);
        })
        .catch((err) => {
          setResults([]);
          setError(
            err.status === 404
              ? "Search unavailable — restart the dev server."
              : "Search failed. Try again.",
          );
          setOpen(true);
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [filterOnly, projectId, query]);

  useEffect(() => {
    if (filterOnly) return;
    const onPointerDown = (event) => {
      const target = event.target;
      if (rootRef.current?.contains(target)) return;
      if (target.closest?.("[data-map-search-menu]")) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [filterOnly]);

  const pick = (task) => {
    if (!filterOnly) {
      setQuery("");
      setResults([]);
      setOpen(false);
    }
    onSelect(task);
  };

  const clearQuery = () => {
    setQuery("");
    if (!filterOnly) {
      setResults([]);
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative w-full max-w-sm">
      <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 focus-within:border-accent/30 focus-within:ring-2 focus-within:ring-accent/10">
        <svg
          className="h-4 w-4 shrink-0 text-stone-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={clearQuery}
            className="shrink-0 rounded p-0.5 text-stone-400 hover:text-stone-600"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        ) : null}
      </div>

      {!filterOnly && open && query.trim().length >= 2 && menuStyle
        ? createPortal(
            <div
              data-map-search-menu
              style={menuStyle}
              className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg"
            >
              {loading ? (
                <p className="px-3 py-2 text-sm text-stone-500">Searching…</p>
              ) : results.length ? (
                <ul className="max-h-72 overflow-y-auto py-1">
                  {results.map((task) => (
                    <li key={task.id}>
                      <button
                        type="button"
                        onClick={() => pick(task)}
                        className="grid w-full grid-cols-[4.5rem_1fr] items-start gap-3 px-3 py-2.5 text-left hover:bg-stone-50"
                      >
                        <span className={cn(tw.label, "pt-0.5 text-stone-400")}>
                          {typeLabel(task.type || "task")}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-stone-900">
                            {task.title}
                          </span>
                          <span className="block truncate text-xs text-stone-500">
                            {task.channelName}
                            {task.priority ? ` · ${task.priority.toUpperCase()}` : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : error ? (
                <p className="px-3 py-2 text-sm text-red-700">{error}</p>
              ) : (
                <p className="px-3 py-2 text-sm text-stone-500">No results found.</p>
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
