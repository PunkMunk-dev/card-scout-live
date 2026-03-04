interface OmniIconProps {
  size?: number;
  dark?: boolean;
}

export function OmniIcon({ size = 36, dark = true }: OmniIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="140" fill={dark ? "#000" : "#fff"} />
      <path
        d="M110 390 L110 140 L180 140 L256 270 L332 130 L402 130 L402 390 L332 390 L332 240 L256 340 L180 240 L180 390 Z"
        fill={dark ? "#fff" : "#000"}
      />
      
    </svg>
  );
}
