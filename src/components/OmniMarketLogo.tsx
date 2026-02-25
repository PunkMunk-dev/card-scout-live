import { cn } from '@/lib/utils';

interface OmniMarketLogoProps {
  /** 'stacked' = two-line lockup, 'inline' = single-line header mode */
  variant?: 'stacked' | 'inline';
  /** Base font size in px for OMNIMARKET line (Cards scales to 58%) */
  size?: number;
  className?: string;
}

export function OmniMarketLogo({ variant = 'stacked', size = 24, className }: OmniMarketLogoProps) {
  const cardsSize = size * 0.58;
  const lineGap = size * 0.6 * 0.25; // 0.6x cap-height ≈ 0.6 * ~42% of font size

  if (variant === 'inline') {
    return (
      <span className={cn('inline-flex items-baseline gap-[0.35em] leading-none select-none', className)} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <span
          className="uppercase text-[#111111] dark:text-white"
          style={{ fontSize: size, letterSpacing: '0.02em' }}
        >
          <span style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>O</span>
          <span style={{ fontWeight: 800, letterSpacing: '-0.01em' }}>M</span>
          <span style={{ fontWeight: 600, letterSpacing: '-0.005em' }}>N</span>
          <span style={{ fontWeight: 600 }}>I</span>
          <span style={{ fontWeight: 600 }}>M</span>
          <span style={{ fontWeight: 600 }}>A</span>
          <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>R</span>
          <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>K</span>
          <span style={{ fontWeight: 600, letterSpacing: '-0.005em' }}>E</span>
          <span style={{ fontWeight: 600 }}>T</span>
        </span>
        <span
          className="text-[#1F3C88] dark:text-[#4C78D0]"
          style={{ fontSize: cardsSize, fontWeight: 500, letterSpacing: '0.08em' }}
        >
          Cards
        </span>
      </span>
    );
  }

  return (
    <div className={cn('flex flex-col leading-none select-none', className)} style={{ fontFamily: "'Inter', system-ui, sans-serif", gap: lineGap }}>
      <span
        className="uppercase text-[#111111] dark:text-white"
        style={{ fontSize: size, letterSpacing: '0.02em' }}
      >
        <span style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>O</span>
        <span style={{ fontWeight: 800, letterSpacing: '-0.01em' }}>M</span>
        <span style={{ fontWeight: 600, letterSpacing: '-0.005em' }}>N</span>
        <span style={{ fontWeight: 600 }}>I</span>
        <span style={{ fontWeight: 600 }}>M</span>
        <span style={{ fontWeight: 600 }}>A</span>
        <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>R</span>
        <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>K</span>
        <span style={{ fontWeight: 600, letterSpacing: '-0.005em' }}>E</span>
        <span style={{ fontWeight: 600 }}>T</span>
      </span>
      <span
        className="text-[#1F3C88] dark:text-[#4C78D0]"
        style={{ fontSize: cardsSize, fontWeight: 500, letterSpacing: '0.08em' }}
      >
        Cards
      </span>
    </div>
  );
}
