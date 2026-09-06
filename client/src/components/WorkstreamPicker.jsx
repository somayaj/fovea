import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { tw, cn } from "../lib/tw.js";

export default function WorkstreamPicker({
  projectId,
  value,
  selectedLabel,
  onChange,
  placeholder = "Search workstreams…",
  allowEmpty = true,
  emptyLabel = "No workstream",
  className = "",
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState(selectedLabel || "");
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    setLabel(selectedLabel || "");
  }, [selectedLabel, value]);

  useEffect(() => {
    if (!projectId || !value) return;
    if (selectedLabel) return;
    api
      .channel(value)
      .then((data) => setLabel(data.channel?.name || ""))
      .catch(() => {});
  }, [projectId, value, selectedLabel]);

  useEffect(() => {
    if (!open || !projectId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.channels(projectId, { q: query, limit: 20, offset: 0 });
        setResults(data.channels);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, projectId, query]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const display = value ? label || "Workstream" : emptyLabel;

  return (
    <div ref={wrapRef} className={`relative min-w-[160px] ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(tw.input, "flex w-full items-center justify-between gap-2 text-left")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{display}</span>
        <span className="text-stone-400" aria-hidden="true">▾</span>
      </button>

      {open ? (
        <div className="absolute z-30 mt-1 w-full min-w-[220px] rounded-lg border border-line bg-surface shadow-lg">
          <div className="border-b border-stone-100 p-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              autoFocus
              className={cn(tw.input, "py-2 text-sm")}
            />
          </div>
          <ul className="max-h-48 overflow-auto py-1" role="listbox">
            {allowEmpty ? (
              <li>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm text-stone-600 hover:bg-accent-soft/40"
                  onClick={() => {
                    onChange("");
                    setLabel("");
                    setOpen(false);
                  }}
                >
                  {emptyLabel}
                </button>
              </li>
            ) : null}
            {loading ? (
              <li className="px-3 py-2 text-sm text-stone-400">Searching…</li>
            ) : null}
            {!loading && results.length === 0 ? (
              <li className="px-3 py-2 text-sm text-stone-400">No workstreams found</li>
            ) : null}
            {results.map((channel) => (
              <li key={channel.id}>
                <button
                  type="button"
                  className={[
                    "block w-full px-3 py-2 text-left text-sm hover:bg-accent-soft/40",
                    channel.id === value ? "bg-stone-100 font-medium text-stone-900" : "text-stone-700",
                  ].join(" ")}
                  onClick={() => {
                    onChange(channel.id);
                    setLabel(channel.name);
                    setOpen(false);
                  }}
                >
                  {channel.name}
                  {channel.tasks > 0 ? (
                    <span className="ml-2 text-xs text-stone-400">{channel.tasks}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
