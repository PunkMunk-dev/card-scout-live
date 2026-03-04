import { Link } from 'react-router-dom';
import { OmniIcon } from './OmniIcon';

interface BrandLockupProps {
  dark?: boolean;
}

export function BrandLockup({ dark = false }: BrandLockupProps) {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0 select-none">
      <OmniIcon size={22} dark={dark} />
      <span
        className="font-display font-semibold text-[17px] leading-none"
        style={{ letterSpacing: '-0.025em', color: 'var(--om-text-0)' }}
      >
        OmniMarket
      </span>
    </Link>
  );
}
