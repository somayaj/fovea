import { Link } from "react-router-dom";

export default function MapGuide({ onAddTask, onDismiss }) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 flex justify-center">
      <div className="pointer-events-auto relative max-w-2xl rounded-xl border border-line/80 bg-surface px-4 py-3">
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss getting started"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center text-stone-400 transition-colors hover:text-stone-900"
        >
          ×
        </button>
        <p className="text-center text-xs font-semibold text-brand">
          Getting started
        </p>
        <div className="mt-2 grid gap-3 text-center sm:grid-cols-3 sm:text-left">
          <div>
            <span className="text-sm font-semibold text-stone-900">1. Add a task</span>
            <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
              Jot down what you need to do — we&apos;ll sort it by priority.
            </p>
          </div>
          <div>
            <span className="text-sm font-semibold text-stone-900">2. See the flow</span>
            <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
              Your top pick rises to the top; supporting tasks sit below.
            </p>
          </div>
          <div>
            <span className="text-sm font-semibold text-stone-900">3. Stay focused</span>
            <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
              <Link to="/" className="font-medium text-brand hover:underline">
                Weekly focus
              </Link>
              {" "}highlights what to work on first.
            </p>
          </div>
        </div>
        <div className="mt-3 flex justify-center border-t border-stone-100 pt-3">
          <button
            type="button"
            onClick={onAddTask}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
          >
            + Add task
          </button>
        </div>
      </div>
    </div>
  );
}
