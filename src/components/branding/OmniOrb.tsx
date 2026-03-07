interface OmniOrbProps {
  variant?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
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
  };

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
