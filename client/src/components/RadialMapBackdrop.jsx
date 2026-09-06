export default function RadialMapBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 960 720"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="conceptHubGlow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#1a3a5c" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0b1a2e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="960" height="720" className="fill-map-bg" />
      <rect width="960" height="720" fill="url(#conceptHubGlow)" />
    </svg>
  );
}
