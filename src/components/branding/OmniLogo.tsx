import { OmniIcon } from './OmniIcon';

interface OmniLogoProps {
  dark?: boolean;
}

export function OmniLogo({ dark = false }: OmniLogoProps) {
  return (
    <div className="flex items-center gap-2">
      <OmniIcon size={30} dark={!dark} />
      <span
        className="font-bold text-xl select-none"
        style={{
          letterSpacing: '-0.02em',
          color: dark ? '#fff' : '#000',
        }}
      >
        OmniMarket
      </span>
    </div>
  );
}
