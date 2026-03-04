interface OmniIconProps {
  size?: number;
  dark?: boolean;
}

export function OmniIcon({ size = 36, dark = true }: OmniIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="140" fill={dark ? "#000" : "#fff"} />
      <path
        d="M120 380 L120 140 L180 140 L256 260 L332 120 L392 120 L392 380 L332 380 L332 230 L256 330 L180 230 L180 380 Z"
        fill={dark ? "#fff" : "#000"}
      />
      
    </svg>
  );
}
