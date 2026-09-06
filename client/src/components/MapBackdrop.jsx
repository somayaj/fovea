export default function MapBackdrop() {
  const cx = 480;
  const cy = 360;

  return (
    <svg className="map-layer" viewBox="0 0 960 720" aria-hidden="true">
      <defs>
        <radialGradient id="warmGlow" cx="50%" cy="50%" r="45%">
          <stop offset="0%" stopColor="#e8a088" stopOpacity="0.35" />
          <stop offset="70%" stopColor="#e8a088" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#faf6f2" stopOpacity="0" />
        </radialGradient>
        <pattern id="dotGrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#e8cfc4" />
        </pattern>
      </defs>
      <rect width="960" height="720" fill="#faf6f2" />
      <rect width="960" height="720" fill="url(#dotGrid)" opacity="0.8" />
      <rect width="960" height="720" fill="url(#warmGlow)" />
      {[100, 180, 260].map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="#e8cfc4" strokeWidth="1" />
      ))}
      <circle className="backdrop-pulse" cx={cx} cy={cy} r="56" fill="none" stroke="#d4836a" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}
