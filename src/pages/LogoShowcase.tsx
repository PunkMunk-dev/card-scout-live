import { OmniOrb } from '@/components/branding/OmniOrb';

const VARIANTS: { variant: 1|2|3|4|5|6|7|8|9|10; name: string }[] = [
  { variant: 1, name: 'OmniCore' },
  { variant: 2, name: 'Quantum' },
  { variant: 3, name: 'Neural Scan' },
  { variant: 4, name: 'Infinite Discovery' },
  { variant: 5, name: 'Marketplace Network' },
  { variant: 6, name: 'Data Core' },
  { variant: 7, name: 'Search Pulse' },
  { variant: 8, name: 'OmniLens' },
  { variant: 9, name: 'Digital Planet' },
  { variant: 10, name: 'HyperSphere' },
];

export default function LogoShowcase() {
  return (
    <div className="min-h-screen bg-background p-8 md:p-12">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">OmniOrb Logo Explorations</h1>
      <p className="text-muted-foreground mb-10">10 variants at multiple sizes. Pick your favorite.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        {VARIANTS.map(({ variant, name }) => (
          <div key={variant} className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center gap-5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              #{variant}
            </span>
            <h2 className="text-sm font-semibold text-foreground">{name}</h2>

            {/* Size ladder */}
            <div className="flex items-end gap-4">
              <OmniOrb variant={variant} size={32} />
              <OmniOrb variant={variant} size={64} />
              <OmniOrb variant={variant} size={120} />
            </div>

            {/* Horizontal lockup */}
            <div className="flex items-center gap-2.5 mt-2">
              <OmniOrb variant={variant} size={28} />
              <span className="om-wordmark text-sm" style={{ color: 'var(--om-text-0)' }}>
                OMNIMARKET
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
