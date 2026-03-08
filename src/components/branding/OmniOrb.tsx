interface OmniOrbProps {
  variant?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30;
  size?: number;
  className?: string;
  mono?: boolean;
}

export function OmniOrb({ variant = 1, size = 40, className = '', mono = false }: OmniOrbProps) {
  const id = `orb-${variant}-${size}${mono ? '-m' : ''}`;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  const accent1 = mono ? '#FFFFFF' : '#00E0C6';
  const accent2 = mono ? '#A0A0A0' : '#3B82F6';
  const bg = mono ? '#000000' : '#0B0B0C';

  const common = (
    <defs>
      <radialGradient id={`${id}-core`} cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor={accent1} stopOpacity="0.95" />
        <stop offset="60%" stopColor={accent2} stopOpacity="0.7" />
        <stop offset="100%" stopColor={bg} stopOpacity="0.9" />
      </radialGradient>
      <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={accent1} stopOpacity="0.3" />
        <stop offset="100%" stopColor={accent1} stopOpacity="0" />
      </radialGradient>
      <filter id={`${id}-blur`}>
        <feGaussianBlur stdDeviation={size * 0.04} />
      </filter>
      <filter id={`${id}-blur-lg`}>
        <feGaussianBlur stdDeviation={size * 0.08} />
      </filter>
    </defs>
  );

  // Reusable 4-point sparkle (AI symbol)
  const sparkle = (sx: number, sy: number, s: number) => {
    const t = s; // tip distance
    const p = s * 0.25; // pinch distance
    return (
      <path
        d={`M${sx} ${sy - t} Q${sx + p} ${sy - p} ${sx + t} ${sy} Q${sx + p} ${sy + p} ${sx} ${sy + t} Q${sx - p} ${sy + p} ${sx - t} ${sy} Q${sx - p} ${sy - p} ${sx} ${sy - t}Z`}
        fill="white"
        opacity="0.85"
      >
        <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
      </path>
    );
  };

  const variants: Record<number, React.ReactNode> = {
    // 1: OmniCore — minimal glowing orb with inner neural core
    1: (
      <>
        {common}
        <circle cx={cx} cy={cy} r={r * 1.5} fill={`url(#${id}-glow)`} filter={`url(#${id}-blur-lg)`}>
          <animate attributeName="opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-core)`} />
        <circle cx={cx} cy={cy} r={r * 0.3} fill="none" stroke="#00E0C6" strokeWidth={size * 0.01} opacity="0.5">
          <animate attributeName="r" values={`${r * 0.25};${r * 0.35};${r * 0.25}`} dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={r * 0.08} fill="#00E0C6" opacity="0.9">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
        </circle>
      </>
    ),
    // 2: Quantum — energy sphere with particle field
    2: (
      <>
        {common}
        <circle cx={cx} cy={cy} r={r * 1.4} fill={`url(#${id}-glow)`} filter={`url(#${id}-blur-lg)`} />
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-core)`} />
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const px = cx + Math.cos((angle * Math.PI) / 180) * r * 0.7;
          const py = cy + Math.sin((angle * Math.PI) / 180) * r * 0.7;
          return <circle key={angle} cx={px} cy={py} r={size * 0.012} fill="#00E0C6" opacity="0.6">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${2 + angle * 0.01}s`} repeatCount="indefinite" />
          </circle>;
        })}
      </>
    ),
    // 3: Neural Scan — orbit rings
    3: (
      <>
        {common}
        <circle cx={cx} cy={cy} r={r * 1.3} fill={`url(#${id}-glow)`} filter={`url(#${id}-blur-lg)`} />
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-core)`} />
        <ellipse cx={cx} cy={cy} rx={r * 1.15} ry={r * 0.35} fill="none" stroke="#00E0C6" strokeWidth={size * 0.008} opacity="0.35" transform={`rotate(-20 ${cx} ${cy})`}>
          <animateTransform attributeName="transform" type="rotate" from={`-20 ${cx} ${cy}`} to={`340 ${cx} ${cy}`} dur="12s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx={cx} cy={cy} rx={r * 1.05} ry={r * 0.25} fill="none" stroke="#3B82F6" strokeWidth={size * 0.006} opacity="0.25" transform={`rotate(40 ${cx} ${cy})`}>
          <animateTransform attributeName="transform" type="rotate" from={`40 ${cx} ${cy}`} to={`400 ${cx} ${cy}`} dur="16s" repeatCount="indefinite" />
        </ellipse>
      </>
    ),
    // 4: Infinite Discovery — infinity symbol inside
    4: (
      <>
        {common}
        <circle cx={cx} cy={cy} r={r * 1.3} fill={`url(#${id}-glow)`} filter={`url(#${id}-blur-lg)`} />
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-core)`} />
        <path
          d={`M${cx - r * 0.3} ${cy} C${cx - r * 0.3} ${cy - r * 0.2} ${cx - r * 0.1} ${cy - r * 0.2} ${cx} ${cy} C${cx + r * 0.1} ${cy + r * 0.2} ${cx + r * 0.3} ${cy + r * 0.2} ${cx + r * 0.3} ${cy} C${cx + r * 0.3} ${cy - r * 0.2} ${cx + r * 0.1} ${cy - r * 0.2} ${cx} ${cy} C${cx - r * 0.1} ${cy + r * 0.2} ${cx - r * 0.3} ${cy + r * 0.2} ${cx - r * 0.3} ${cy}`}
          fill="none" stroke="#00E0C6" strokeWidth={size * 0.012} opacity="0.6"
        />
      </>
    ),
    // 5: Marketplace Network — orbiting nodes
    5: (
      <>
        {common}
        <circle cx={cx} cy={cy} r={r * 1.3} fill={`url(#${id}-glow)`} filter={`url(#${id}-blur-lg)`} />
        <circle cx={cx} cy={cy} r={r * 0.7} fill={`url(#${id}-core)`} />
        {[0, 72, 144, 216, 288].map((angle, i) => {
          const px = cx + Math.cos((angle * Math.PI) / 180) * r;
          const py = cy + Math.sin((angle * Math.PI) / 180) * r;
          return <g key={angle}>
            <line x1={cx} y1={cy} x2={px} y2={py} stroke="#00E0C6" strokeWidth={size * 0.005} opacity="0.15" />
            <circle cx={px} cy={py} r={size * 0.022} fill="#00E0C6" opacity="0.7">
              <animate attributeName="opacity" values="0.4;0.9;0.4" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
            </circle>
          </g>;
        })}
      </>
    ),
    // 6: Data Core — concentric rings
    6: (
      <>
        {common}
        <circle cx={cx} cy={cy} r={r * 1.3} fill={`url(#${id}-glow)`} filter={`url(#${id}-blur-lg)`} opacity={mono ? 0.6 : 1} />
        {[0.9, 0.7, 0.5, 0.3].map((scale, i) => (
          <circle key={i} cx={cx} cy={cy} r={r * scale} fill="none" stroke={mono && i === 0 ? '#000000' : (i % 2 === 0 ? accent1 : accent2)} strokeWidth={mono ? size * 0.02 : size * 0.008} opacity={mono ? (i === 0 ? 0.9 : 0.5 + i * 0.12) : 0.2 + i * 0.1} />
        ))}
        <circle cx={cx} cy={cy} r={r * (mono ? 0.2 : 0.15)} fill={mono ? '#00E0C6' : accent1} opacity={mono ? "1" : "0.8"}>
          <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
        </circle>
      </>
    ),
    // 7: Search Pulse — signal waves
    7: (
      <>
        {common}
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-core)`} />
        {[1.2, 1.5, 1.8].map((scale, i) => (
          <circle key={i} cx={cx} cy={cy} r={r * scale} fill="none" stroke="#00E0C6" strokeWidth={size * 0.006} opacity="0">
            <animate attributeName="opacity" values="0.4;0" dur="3s" begin={`${i * 0.8}s`} repeatCount="indefinite" />
            <animate attributeName="r" values={`${r * scale};${r * (scale + 0.4)}`} dur="3s" begin={`${i * 0.8}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </>
    ),
    // 8: OmniLens — magnifying lens style
    8: (
      <>
        {common}
        <circle cx={cx} cy={cy} r={r * 1.3} fill={`url(#${id}-glow)`} filter={`url(#${id}-blur-lg)`} />
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-core)`} />
        <circle cx={cx} cy={cy} r={r * 0.85} fill="none" stroke="#00E0C6" strokeWidth={size * 0.015} opacity="0.4" />
        <line x1={cx + r * 0.6} y1={cy + r * 0.6} x2={cx + r * 1.1} y2={cy + r * 1.1} stroke="#00E0C6" strokeWidth={size * 0.02} opacity="0.35" strokeLinecap="round" />
      </>
    ),
    // 9: Digital Planet — global commerce
    9: (
      <>
        {common}
        <circle cx={cx} cy={cy} r={r * 1.3} fill={`url(#${id}-glow)`} filter={`url(#${id}-blur-lg)`} />
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-core)`} />
        <ellipse cx={cx} cy={cy} rx={r * 0.4} ry={r} fill="none" stroke="#00E0C6" strokeWidth={size * 0.006} opacity="0.25" />
        <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.4} fill="none" stroke="#3B82F6" strokeWidth={size * 0.006} opacity="0.2" />
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#00E0C6" strokeWidth={size * 0.004} opacity="0.15" />
      </>
    ),
    // 10: HyperSphere — neural sphere with halo
    10: (
      <>
        {common}
        <circle cx={cx} cy={cy} r={r * 1.6} fill="none" stroke="#00E0C6" strokeWidth={size * 0.006} opacity="0.12">
          <animate attributeName="opacity" values="0.08;0.18;0.08" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={r * 1.3} fill={`url(#${id}-glow)`} filter={`url(#${id}-blur-lg)`}>
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-core)`} />
        <circle cx={cx} cy={cy} r={r * 0.5} fill="none" stroke="#00E0C6" strokeWidth={size * 0.005} opacity="0.3" strokeDasharray={`${size * 0.03} ${size * 0.03}`}>
          <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="20s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={r * 0.06} fill="#fff" opacity="0.9" />
      </>
    ),
    // 11: Split Sphere — Black/Teal
    11: (
      <>
        <defs>
          <linearGradient id={`${id}-split`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="50%" stopColor="#000000" />
            <stop offset="100%" stopColor="#00E0C6" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-split)`} />
        {sparkle(cx + r * 0.25, cy - r * 0.25, r * 0.22)}
      </>
    ),
    // 12: Split Sphere — Black/Blue
    12: (
      <>
        <defs>
          <linearGradient id={`${id}-split`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="50%" stopColor="#000000" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-split)`} />
        {sparkle(cx + r * 0.25, cy - r * 0.25, r * 0.22)}
      </>
    ),
    // 13: Split Sphere — Teal/Blue
    13: (
      <>
        <defs>
          <linearGradient id={`${id}-split`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E0C6" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-split)`} />
        {sparkle(cx + r * 0.25, cy - r * 0.25, r * 0.22)}
      </>
    ),
    // 14: Split Sphere — Radial Core
    14: (
      <>
        <defs>
          <radialGradient id={`${id}-split`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00E0C6" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#00E0C6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-split)`} />
        {sparkle(cx + r * 0.25, cy - r * 0.25, r * 0.22)}
      </>
    ),
    // 15: Split Sphere — Triple Band
    15: (
      <>
        <defs>
          <linearGradient id={`${id}-split`} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="40%" stopColor="#00E0C6" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-split)`} />
        {sparkle(cx + r * 0.25, cy - r * 0.25, r * 0.22)}
      </>
    ),
  };

  // Hex-knot geometry — 3 interlocking ribbon bands at 120° intervals
  const hexKnot = (() => {
    const s = r * 0.95; // scale to fit
    // 6 vertices of outer hex
    const hv = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return [cx + s * Math.cos(a), cy + s * Math.sin(a)] as [number, number];
    });
    // 6 inner hex vertices (for ribbon width)
    const ih = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return [cx + s * 0.5 * Math.cos(a), cy + s * 0.5 * Math.sin(a)] as [number, number];
    });
    // 3 ribbon bands: each connects two opposite edges with a parallelogram shape
    const bands = [
      // Band 0: top-right to bottom-left
      [hv[0], hv[1], ih[1], ih[4], hv[4], hv[3], ih[3], ih[0]],
      // Band 1: right to left
      [hv[1], hv[2], ih[2], ih[5], hv[5], hv[4], ih[4], ih[1]],
      // Band 2: bottom-right to top-left
      [hv[2], hv[3], ih[3], ih[0], hv[0], hv[5], ih[5], ih[2]],
    ];
    return bands.map(pts =>
      `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)} ` +
      pts.slice(1).map(p => `L${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ') + 'Z'
    );
  })();

  // 16: Mono White — white strokes on transparent
  variants[16] = (
    <>
      {hexKnot.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="white" strokeWidth={size * 0.02} strokeLinejoin="round" opacity="0.9" />
      ))}
    </>
  );

  // 17: Teal→Blue gradient strokes
  variants[17] = (
    <>
      <defs>
        <linearGradient id={`${id}-hex-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E0C6" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      {hexKnot.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={`url(#${id}-hex-grad)`} strokeWidth={size * 0.02} strokeLinejoin="round" opacity="0.9" />
      ))}
    </>
  );

  // 18: Glow — white strokes with teal glow behind
  variants[18] = (
    <>
      <defs>
        <filter id={`${id}-hex-glow`}>
          <feGaussianBlur stdDeviation={size * 0.04} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {hexKnot.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#00E0C6" strokeWidth={size * 0.035} strokeLinejoin="round" opacity="0.35" filter={`url(#${id}-hex-glow)`} />
      ))}
      {hexKnot.map((d, i) => (
        <path key={`f-${i}`} d={d} fill="none" stroke="white" strokeWidth={size * 0.02} strokeLinejoin="round" opacity="0.9" />
      ))}
    </>
  );

  // 19: Duotone — alternating teal and blue bands
  const duoColors = ['#00E0C6', '#3B82F6', '#00E0C6'];
  variants[19] = (
    <>
      {hexKnot.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={duoColors[i]} strokeWidth={size * 0.02} strokeLinejoin="round" opacity="0.9" />
      ))}
    </>
  );

  // 20: Filled hex bg with white knot
  variants[20] = (() => {
    const s2 = r * 1.05;
    const bgHex = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${(cx + s2 * Math.cos(a)).toFixed(2)},${(cy + s2 * Math.sin(a)).toFixed(2)}`;
    }).join(' ');
    return (
      <>
        <polygon points={bgHex} fill="#0B0B0C" />
        {hexKnot.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="white" strokeWidth={size * 0.02} strokeLinejoin="round" opacity="0.9" />
        ))}
      </>
    );
  })();

  // Per-variant search mask positions — each gets a unique edge placement
  const searchPositions: Record<number, { cx: number; cy: number; handleAngle: number }> = {
    21: { cx: cx + r * 0.52, cy: cy - r * 0.38, handleAngle: 45 },   // top-right
    22: { cx: cx - r * 0.48, cy: cy + r * 0.44, handleAngle: 225 },  // bottom-left
    23: { cx: cx + r * 0.50, cy: cy + r * 0.42, handleAngle: 135 },  // bottom-right
    24: { cx: cx - r * 0.46, cy: cy - r * 0.40, handleAngle: 315 },  // top-left
    25: { cx: cx + r * 0.55, cy: cy + r * 0.05, handleAngle: 90 },   // right-center
  };

  const sp = searchPositions[variant] ?? searchPositions[21];
  const searchMaskId = `${id}-search-mask`;
  const eR = r * 0.14; // even smaller lens
  const eAngle = (sp.handleAngle * Math.PI) / 180;
  const ehx1 = sp.cx + eR * Math.cos(eAngle);
  const ehy1 = sp.cy + eR * Math.sin(eAngle);
  const ehx2 = sp.cx + (eR + r * 0.18) * Math.cos(eAngle);
  const ehy2 = sp.cy + (eR + r * 0.18) * Math.sin(eAngle);

  const edgeSearchMask = (
    <mask id={searchMaskId}>
      <rect x="0" y="0" width={size} height={size} fill="white" />
      <circle cx={sp.cx} cy={sp.cy} r={eR} fill="black" />
      <line x1={ehx1} y1={ehy1} x2={ehx2} y2={ehy2} stroke="black" strokeWidth={r * 0.065} strokeLinecap="round" />
    </mask>
  );

  const tealBlueGrad = (
    <linearGradient id={`${id}-tb-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#00E0C6" />
      <stop offset="100%" stopColor="#3B82F6" />
    </linearGradient>
  );

  // 21 — Open Knot: gradient strokes (not filled), edge search cutout
  variants[21] = (
    <>
      <defs>
        {tealBlueGrad}
        {edgeSearchMask}
      </defs>
      <g mask={`url(#${searchMaskId})`}>
        {hexKnot.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={`url(#${id}-tb-grad)`} strokeWidth={size * 0.025} strokeLinejoin="round" opacity="0.9" />
        ))}
      </g>
    </>
  );

  // 22 — Broken Band: band[1] has a gap near the search icon, others solid fill
  variants[22] = (() => {
    // Create a secondary mask that removes a chunk from band 1 near the search area
    const breakMaskId = `${id}-break-mask`;
    return (
      <>
        <defs>
          {tealBlueGrad}
          {edgeSearchMask}
          <mask id={breakMaskId}>
            <rect x="0" y="0" width={size} height={size} fill="white" />
            {/* Remove a wedge from band 1 near the search icon */}
            <circle cx={sp.cx - r * 0.1} cy={sp.cy - r * 0.1} r={r * 0.22} fill="black" />
          </mask>
        </defs>
        <g mask={`url(#${searchMaskId})`}>
          <path d={hexKnot[0]} fill={`url(#${id}-tb-grad)`} opacity="0.9" />
          {/* Band 1 with break */}
          <g mask={`url(#${breakMaskId})`}>
            <path d={hexKnot[1]} fill={`url(#${id}-tb-grad)`} opacity="0.9" />
          </g>
          <path d={hexKnot[2]} fill={`url(#${id}-tb-grad)`} opacity="0.9" />
        </g>
      </>
    );
  })();

  // 23 — Rounded Knot: softened geometry with quadratic curves
  variants[23] = (() => {
    const s = r * 0.95;
    const hv = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return [cx + s * Math.cos(a), cy + s * Math.sin(a)] as [number, number];
    });
    const ih = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return [cx + s * 0.5 * Math.cos(a), cy + s * 0.5 * Math.sin(a)] as [number, number];
    });
    // Same band topology but with quadratic curves at corners
    const roundBand = (pts: [number, number][]) => {
      const f = (p: [number, number]) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
      const mid = (a: [number, number], b: [number, number]): [number, number] =>
        [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      // Start at midpoint of first edge
      const m0 = mid(pts[0], pts[1]);
      let d = `M${f(m0)}`;
      for (let i = 0; i < pts.length; i++) {
        const next = pts[(i + 1) % pts.length];
        const mNext = mid(pts[(i + 1) % pts.length], pts[(i + 2) % pts.length]);
        d += ` Q${f(next)} ${f(mNext)}`;
      }
      d += 'Z';
      return d;
    };
    const roundBands = [
      [hv[0], hv[1], ih[1], ih[4], hv[4], hv[3], ih[3], ih[0]],
      [hv[1], hv[2], ih[2], ih[5], hv[5], hv[4], ih[4], ih[1]],
      [hv[2], hv[3], ih[3], ih[0], hv[0], hv[5], ih[5], ih[2]],
    ].map(roundBand);

    return (
      <>
        <defs>
          {tealBlueGrad}
          {edgeSearchMask}
        </defs>
        <g mask={`url(#${searchMaskId})`}>
          {roundBands.map((d, i) => (
            <path key={i} d={d} fill={`url(#${id}-tb-grad)`} opacity="0.9" />
          ))}
        </g>
      </>
    );
  })();

  // 24 — Layered Depth: bands at varying opacity with drop shadow on front
  variants[24] = (
    <>
      <defs>
        {tealBlueGrad}
        {edgeSearchMask}
        <filter id={`${id}-drop`}>
          <feDropShadow dx={size * 0.005} dy={size * 0.01} stdDeviation={size * 0.02} floodColor="#00E0C6" floodOpacity="0.4" />
        </filter>
      </defs>
      <g mask={`url(#${searchMaskId})`}>
        <path d={hexKnot[0]} fill={`url(#${id}-tb-grad)`} opacity="0.35" />
        <path d={hexKnot[1]} fill={`url(#${id}-tb-grad)`} opacity="0.6" />
        <path d={hexKnot[2]} fill={`url(#${id}-tb-grad)`} opacity="0.92" filter={`url(#${id}-drop)`} />
      </g>
    </>
  );

  // 25 — Partial Fill: halves nearest search filled, far halves stroke-only
  variants[25] = (() => {
    const fadeMaskId = `${id}-fade-mask`;
    // Gradient mask: right-bottom half is white (filled), left-top fades to grey (stroke-only effect)
    return (
      <>
        <defs>
          {tealBlueGrad}
          {edgeSearchMask}
          <linearGradient id={`${id}-fade-dir`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="black" />
            <stop offset="45%" stopColor="black" />
            <stop offset="70%" stopColor="white" />
            <stop offset="100%" stopColor="white" />
          </linearGradient>
          <mask id={fadeMaskId}>
            <rect x="0" y="0" width={size} height={size} fill={`url(#${id}-fade-dir)`} />
          </mask>
        </defs>
        <g mask={`url(#${searchMaskId})`}>
          {/* Stroke outlines everywhere */}
          {hexKnot.map((d, i) => (
            <path key={`s-${i}`} d={d} fill="none" stroke={`url(#${id}-tb-grad)`} strokeWidth={size * 0.012} strokeLinejoin="round" opacity="0.5" />
          ))}
          {/* Filled halves fading in near search */}
          <g mask={`url(#${fadeMaskId})`}>
            {hexKnot.map((d, i) => (
              <path key={`f-${i}`} d={d} fill={`url(#${id}-tb-grad)`} opacity="0.9" />
            ))}
          </g>
        </g>
      </>
    );
  })();

  // Cloud-Signal Series (26–30) — greyscale, theme-aware via mono
  // Cloud path builder relative to cx/cy/r
  const cloudPath = (() => {
    const cw = r * 1.05;  // wider cloud
    const ch = r * 0.65;  // taller puffs
    const baseY = cy + r * 0.2;
    const leftX = cx - cw * 0.5;
    const rightX = cx + cw * 0.5;
    // 3 puffy bumps across the top, rounder curves
    return `M${leftX} ${baseY}
      C${leftX - cw * 0.08} ${baseY - ch * 0.5} ${leftX + cw * 0.05} ${baseY - ch * 0.9} ${cx - cw * 0.18} ${baseY - ch * 0.75}
      C${cx - cw * 0.12} ${baseY - ch * 1.35} ${cx + cw * 0.05} ${baseY - ch * 1.35} ${cx + cw * 0.08} ${baseY - ch * 0.85}
      C${cx + cw * 0.18} ${baseY - ch * 1.2} ${cx + cw * 0.42} ${baseY - ch * 1.0} ${cx + cw * 0.42} ${baseY - ch * 0.5}
      C${rightX + cw * 0.08} ${baseY - ch * 0.15} ${rightX} ${baseY} ${rightX} ${baseY}
      Z`;
  })();

  // Signal arcs emanating from top-right of cloud — wider sweep
  const signalCenter = { x: cx + r * 0.2, y: cy - r * 0.3 };
  const signalArcs = (stroke: string, sw: number, opacities: number[]) =>
    [0.3, 0.5, 0.7].map((scale, i) => {
      const arcR = r * scale;
      const startAngle = -80 * (Math.PI / 180);  // wider sweep (was -70)
      const endAngle = 30 * (Math.PI / 180);      // wider sweep (was 20)
      const x1 = signalCenter.x + arcR * Math.cos(startAngle);
      const y1 = signalCenter.y + arcR * Math.sin(startAngle);
      const x2 = signalCenter.x + arcR * Math.cos(endAngle);
      const y2 = signalCenter.y + arcR * Math.sin(endAngle);
      return (
        <path
          key={i}
          d={`M${x1} ${y1} A${arcR} ${arcR} 0 0 1 ${x2} ${y2}`}
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          opacity={opacities[i] ?? 0.7}
        />
      );
    });

  const greyStroke = mono ? accent1 : '#9CA3AF';
  const greyFill = mono ? accent1 : '#6B7280';
  const sw = size * 0.02;

  // Cloud fill gradient — subtle grey, top-to-bottom
  const cloudGradId = `cloudFill-${variant}-${size}`;
  const cloudFillTop = mono ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
  const cloudFillBot = mono ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const cloudDefs = (
    <defs>
      <linearGradient id={cloudGradId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={cloudFillTop} />
        <stop offset="100%" stopColor={cloudFillBot} />
      </linearGradient>
    </defs>
  );
  const cloudFillUrl = `url(#${cloudGradId})`;

  // 26 — Cloud Core: filled cloud + 3 signal arcs
  variants[26] = (
    <>
      {cloudDefs}
      <path d={cloudPath} fill={cloudFillUrl} stroke={greyStroke} strokeWidth={sw} strokeLinejoin="round" opacity="0.85" />
      {signalArcs(greyStroke, sw, [0.8, 0.6, 0.4])}
    </>
  );

  // 27 — Cloud Pulse: cloud + animated pulsing signal waves
  variants[27] = (
    <>
      {cloudDefs}
      <path d={cloudPath} fill={cloudFillUrl} stroke={greyStroke} strokeWidth={sw} strokeLinejoin="round" opacity="0.85" />
      {[0.3, 0.5, 0.7].map((scale, i) => {
        const arcR = r * scale;
        const startAngle = -80 * (Math.PI / 180);
        const endAngle = 30 * (Math.PI / 180);
        const x1 = signalCenter.x + arcR * Math.cos(startAngle);
        const y1 = signalCenter.y + arcR * Math.sin(startAngle);
        const x2 = signalCenter.x + arcR * Math.cos(endAngle);
        const y2 = signalCenter.y + arcR * Math.sin(endAngle);
        return (
          <path
            key={i}
            d={`M${x1} ${y1} A${arcR} ${arcR} 0 0 1 ${x2} ${y2}`}
            fill="none"
            stroke={greyStroke}
            strokeWidth={sw}
            strokeLinecap="round"
            opacity="0"
          >
            <animate attributeName="opacity" values="0.7;0" dur="2.5s" begin={`${i * 0.6}s`} repeatCount="indefinite" />
          </path>
        );
      })}
    </>
  );

  // 28 — Cloud Lens: cloud + magnifying glass integrated at signal origin
  variants[28] = (() => {
    const lensR = r * 0.13;
    const lensAngle = 45 * (Math.PI / 180);
    const lx = signalCenter.x + lensR * Math.cos(lensAngle);
    const ly = signalCenter.y + lensR * Math.sin(lensAngle);
    const lx2 = signalCenter.x + (lensR + r * 0.2) * Math.cos(lensAngle);
    const ly2 = signalCenter.y + (lensR + r * 0.2) * Math.sin(lensAngle);
    return (
      <>
        {cloudDefs}
        <path d={cloudPath} fill={cloudFillUrl} stroke={greyStroke} strokeWidth={sw} strokeLinejoin="round" opacity="0.85" />
        {signalArcs(greyStroke, sw * 0.7, [0.5, 0.35, 0.2])}
        <circle cx={signalCenter.x} cy={signalCenter.y} r={lensR} fill="none" stroke={greyStroke} strokeWidth={sw * 1.2} opacity="0.9" />
        <line x1={lx} y1={ly} x2={lx2} y2={ly2} stroke={greyStroke} strokeWidth={sw * 1.3} strokeLinecap="round" opacity="0.8" />
      </>
    );
  })();

  // 29 — Cloud Ring: cloud inside a thin circular ring, arcs breaking through
  variants[29] = (
    <>
      {cloudDefs}
      <circle cx={cx} cy={cy} r={r * 0.95} fill="none" stroke={greyStroke} strokeWidth={sw * 0.6} opacity="0.3" />
      <path d={cloudPath} fill={cloudFillUrl} stroke={greyStroke} strokeWidth={sw} strokeLinejoin="round" opacity="0.85" />
      {signalArcs(greyStroke, sw, [0.7, 0.5, 0.35])}
    </>
  );

  // 30 — Cloud Node: cloud + signal arcs with dots at tips
  variants[30] = (() => {
    const nodeR = size * 0.025;
    const nodes = [0.28, 0.45, 0.62].map((scale) => {
      const arcR = r * scale;
      const endAngle = 20 * (Math.PI / 180);
      return {
        x: signalCenter.x + arcR * Math.cos(endAngle),
        y: signalCenter.y + arcR * Math.sin(endAngle),
      };
    });
    return (
      <>
        <path d={cloudPath} fill="none" stroke={greyStroke} strokeWidth={sw} strokeLinejoin="round" opacity="0.85" />
        {signalArcs(greyStroke, sw, [0.7, 0.55, 0.4])}
        {nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={nodeR} fill={greyFill} opacity={0.9 - i * 0.15} />
        ))}
      </>
    );
  })();

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="OmniMarket"
    >
      {variants[variant]}
    </svg>
  );
}
