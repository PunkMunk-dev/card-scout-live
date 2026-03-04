import omniIcon from '@/assets/omni-icon.png';

interface OmniIconProps {
  size?: number;
  dark?: boolean;
}

export function OmniIcon({ size = 36, dark = true }: OmniIconProps) {
  return (
    <img
      src={omniIcon}
      alt="OmniMarket"
      width={size}
      height={size}
      className="select-none"
      style={{
        filter: dark ? 'invert(1)' : 'none',
        mixBlendMode: dark ? 'screen' : 'multiply',
      }}
    />
  );
}
