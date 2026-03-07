import { OmniOrb } from './OmniOrb';

interface OmniIconProps {
  size?: number;
  dark?: boolean;
}

export function OmniIcon({ size = 36 }: OmniIconProps) {
  return <OmniOrb variant={6} size={size} mono />;
}
