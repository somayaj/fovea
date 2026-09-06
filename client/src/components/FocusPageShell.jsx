import FocusAmbient from "./FocusAmbient.jsx";
import { cn } from "../lib/tw.js";

/** Wraps inner app pages with the Fovea focus visual theme. */
export default function FocusPageShell({ children, className = "", fill = false }) {
  return (
    <div className={cn("relative flex min-h-full flex-col bg-paper", fill && "h-full min-h-0", className)}>
      <FocusAmbient variant="page" />
      <div className={cn("relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col", fill && "h-full")}>
        {children}
      </div>
    </div>
  );
}
