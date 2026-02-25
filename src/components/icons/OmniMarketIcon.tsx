interface OmniMarketIconProps {
  size?: number;
  className?: string;
}

export function OmniMarketIcon({ size = 64, className }: OmniMarketIconProps) {
  const radius = size * 0.22;
  const fontSize = size * 0.38;
  const underlineThickness = fontSize * 0.06;
  const underlineOffset = fontSize * 0.08;
  const textY = size * 0.54;
  const underlineY = textY + underlineOffset + fontSize * 0.1;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width={size} height={size} rx={radius} fill="#0B1F3B" />
      <text
        x="50%"
        y={textY}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        fontFamily="'Inter', system-ui, sans-serif"
        fontWeight={800}
        fontSize={fontSize}
        letterSpacing="-0.02em"
      >
        OM
      </text>
      <rect
        x={(size - fontSize * 1.1) / 2}
        y={underlineY}
        width={fontSize * 1.1}
        height={underlineThickness}
        rx={underlineThickness / 2}
        fill="#FFFFFF"
      />
    </svg>
  );
}
