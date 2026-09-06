import { Link } from "react-router-dom";
import FoveaLogo from "./FoveaLogo.jsx";
import FocusAmbient from "./FocusAmbient.jsx";
import LegalFooter from "./LegalFooter.jsx";

export default function LegalLayout({ title, children }) {
  return (
    <div className="relative flex min-h-full flex-col bg-paper">
      <FocusAmbient variant="page" />
      <div className="relative z-[1] mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link to="/" className="rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/30">
            <FoveaLogo size="sm" subtitle="Your week, one clear priority." />
          </Link>
          <Link to="/" className="text-sm font-medium text-muted hover:text-brand">
            Back to sign in
          </Link>
        </div>

        <article className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight text-brand">{title}</h1>
          <div className="prose-legal mt-8 space-y-5 text-sm leading-relaxed text-stone-700">{children}</div>
        </article>

        <LegalFooter className="mt-12 border-t border-line/80 pt-6" />
      </div>
    </div>
  );
}
