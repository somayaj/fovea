const SYNAPSES = [
  { axon: "M480 360 L350 280", bouton: [350, 280], delay: 0 },
  { axon: "M480 360 L610 250", bouton: [610, 250], delay: 0.2 },
  { axon: "M480 360 L660 380", bouton: [660, 380], delay: 0.45 },
  { axon: "M480 360 L580 500", bouton: [580, 500], delay: 0.7 },
  { axon: "M480 360 L380 480", bouton: [380, 480], delay: 0.95 },
  { axon: "M480 360 L260 360", bouton: [260, 360], delay: 0.35 },
  { axon: "M480 360 L700 360", bouton: [700, 360], delay: 0.6 },
  { axon: "M480 360 L420 220", bouton: [420, 220], delay: 0.15 },
  { axon: "M480 360 L540 220", bouton: [540, 220], delay: 0.5 },
  { axon: "M480 360 L480 520", bouton: [480, 520], delay: 0.8 },
];

function cleftPoint(axon, bouton, gap = 14) {
  const [bx, by] = bouton;
  const mx = (480 + bx) / 2;
  const my = (360 + by) / 2;
  const dx = bx - 480;
  const dy = by - 360;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const preEnd = [mx - ux * (gap / 2), my - uy * (gap / 2)];
  const postStart = [mx + ux * (gap / 2), my + uy * (gap / 2)];
  const axonEnd = [bx - ux * 18, by - uy * 18];
  return { preEnd, postStart, axonEnd, cleft: [mx, my] };
}

export default function NerveBackdrop() {
  return (
    <svg className="map-layer nerve-layer synapse-layer" viewBox="0 0 960 720" aria-hidden="true">
      <defs>
        <radialGradient id="somaGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f4a88a" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#d4836a" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#faf6f2" stopOpacity="0" />
        </radialGradient>
        <filter id="synapseSoft">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="960" height="720" fill="#faf6f2" />
      <rect width="960" height="720" fill="url(#somaGlow)" />

      <g className="synapse-network" filter="url(#synapseSoft)">
        {SYNAPSES.map((syn, i) => {
          const { preEnd, postStart, axonEnd, cleft } = cleftPoint(syn.axon, syn.bouton);
          const vesiclePath = `M ${preEnd[0]} ${preEnd[1]} L ${postStart[0]} ${postStart[1]}`;
          const [bx, by] = syn.bouton;
          return (
            <g key={i} className="synapse-unit">
              <path className="synapse-axon-bg" d={`M480 360 L ${axonEnd[0]} ${axonEnd[1]}`} />
              <path className="synapse-axon-bg" d={`M ${postStart[0]} ${postStart[1]} L ${bx} ${by}`} />
              <ellipse className="synapse-bouton-bg" cx={preEnd[0]} cy={preEnd[1]} rx="6" ry="8" />
              <circle className="synapse-spine-bg" cx={postStart[0]} cy={postStart[1]} r="3.5" />
              <ellipse className="synapse-terminal-bg" cx={bx} cy={by} rx="10" ry="12" />
              <circle className="synapse-cleft-bg" cx={cleft[0]} cy={cleft[1]} r="3" />
              <circle className="synapse-vesicle-bg" r="3" fill="#c45f3e" opacity="0.85">
                <animateMotion
                  dur="1.4s"
                  begin={`${syn.delay}s`}
                  repeatCount="indefinite"
                  path={vesiclePath}
                />
              </circle>
            </g>
          );
        })}
      </g>

      <g className="nerve-soma">
        <circle className="soma-ring soma-ring-1" cx="480" cy="360" r="88" />
        <circle className="soma-ring soma-ring-2" cx="480" cy="360" r="88" />
        <ellipse className="soma-core" cx="480" cy="360" rx="36" ry="32" />
        <circle className="soma-nucleus" cx="480" cy="360" r="11" />
      </g>
    </svg>
  );
}
