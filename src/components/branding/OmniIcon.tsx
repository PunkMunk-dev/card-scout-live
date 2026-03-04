interface OmniIconProps {
  size?: number;
  dark?: boolean;
}

export function OmniIcon({ size = 36, dark = true }: OmniIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="140" fill={dark ? "#000" : "#fff"} />
      <path
        d="M130 360 L130 160 L210 160 L256 240 L302 140 L382 160 L382 360 L320 360 L320 240 L256 310 L190 240 L190 360 Z"
        fill={dark ? "#fff" : "#000"}
      />
      <circle cx="420" cy="350" r="18" fill={dark ? "#fff" : "#000"} />
    </svg>
  );
}
