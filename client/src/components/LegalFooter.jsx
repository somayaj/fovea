import { Link } from "react-router-dom";
import { cn } from "../lib/tw.js";

export default function LegalFooter({ className = "" }) {
  return (
    <footer className={cn("flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted", className)}>
      <Link to="/privacy" className="hover:text-brand hover:underline">
        Privacy
      </Link>
      <span aria-hidden="true" className="text-line">·</span>
      <Link to="/license" className="hover:text-brand hover:underline">
        MIT License
      </Link>
    </footer>
  );
}
