import { OmniOrb } from './OmniOrb';

interface OmniLogoProps {
  dark?: boolean;
}

export function OmniLogo({ dark = false }: OmniLogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <OmniOrb variant={1} size={34} />
      <span
        className="om-wordmark text-[18px]"
        style={{ color: 'var(--om-text-0)' }}
      >
        OMNIMARKET
      </span>
    </div>
  );
}
