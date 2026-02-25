export function OmniMarketWatermark() {
  return (
    <span
      className="absolute bottom-1 right-1 pointer-events-none select-none"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 800,
        fontSize: 10,
        letterSpacing: '-0.02em',
        opacity: 0.08,
        color: '#000000',
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      OM
    </span>
  );
}
