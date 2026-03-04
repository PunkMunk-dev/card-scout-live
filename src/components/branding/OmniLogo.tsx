import { OmniIcon } from './OmniIcon';

interface OmniLogoProps {
  dark?: boolean;
}

export function OmniLogo({ dark = false }: OmniLogoProps) {
  return (
    <div className="flex items-center gap-2">
      <OmniIcon size={34} dark={!dark} />
      <span
        className="font-display font-semibold text-[22px] select-none"
        style={{ letterSpacing: '-0.03em' }}
      >
        <span style={{ color: dark ? '#F5F7FF' : '#111827' }}>Omni</span>
        <span style={{ color: dark ? '#7F8AA3' : '#6B7280' }}>Market</span>
      </span>
    </div>
  );
}
