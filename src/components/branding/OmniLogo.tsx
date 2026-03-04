import { OmniIcon } from './OmniIcon';

interface OmniLogoProps {
  dark?: boolean;
}

export function OmniLogo({ dark = false }: OmniLogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <OmniIcon size={34} dark={!dark} />
      <span
        className="font-display font-semibold text-[22px] select-none"
        style={{ letterSpacing: '-0.025em' }}
      >
        <span className="text-white">Omni</span>
        <span className="text-white">Market</span>
      </span>
    </div>
  );
}
