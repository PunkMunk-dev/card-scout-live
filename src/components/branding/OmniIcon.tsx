interface OmniIconProps {
  size?: number;
  dark?: boolean;
}

export function OmniIcon({ size = 36, dark = true }: OmniIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="140" fill={dark ? "#000" : "#fff"} />
      <path
        d="M110 390 L110 132 L182 132 L256 275 L330 132 L402 132 L402 390 L338 390 L338 235 L256 345 L174 235 L174 390 Z"
        fill={dark ? "#fff" : "#000"}
      />
      
    </svg>
  );
}
