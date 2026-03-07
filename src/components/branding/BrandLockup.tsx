import { Link } from 'react-router-dom';
import { OmniOrb } from './OmniOrb';

interface BrandLockupProps {
  dark?: boolean;
}

export function BrandLockup({ dark = false }: BrandLockupProps) {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0 select-none">
      <OmniOrb variant={6} size={26} mono />
      <span
        className="om-wordmark text-[14px]"
        style={{ color: 'var(--om-text-0)' }}
      >
        OMNIMARKET
      </span>
    </Link>
  );
}
