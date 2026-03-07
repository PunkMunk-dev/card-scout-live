import { OmniOrb } from '@/components/branding/OmniOrb';

const VARIANTS: { variant: 11|12|13|14|15; name: string; desc: string }[] = [
  { variant: 11, name: 'Black Dot', desc: 'Pure minimal mark' },
  { variant: 12, name: 'Green Core', desc: 'Black with green center' },
  { variant: 13, name: 'Ringed Dot', desc: 'Black with green ring' },
  { variant: 14, name: 'Split Sphere', desc: 'Two-tone gradient' },
  { variant: 15, name: 'Beacon', desc: 'Green crescent highlight' },
];

export default function LogoShowcase() {
  return (
    <div className="min-h-screen bg-background p-8 md:p-12">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Logo Renditions</h1>
      <p className="text-muted-foreground mb-10">5 curated marks — minimal to expressive.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        {VARIANTS.map(({ variant, name, desc }) => (
          <div key={variant} className="flex flex-col gap-6">
            {/* Dark card */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center gap-5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                #{variant - 10}
              </span>
              <h2 className="text-sm font-semibold text-foreground">{name}</h2>
              <p className="text-xs text-muted-foreground">{desc}</p>

              <div className="flex items-end gap-4">
                <OmniOrb variant={variant} size={32} />
                <OmniOrb variant={variant} size={64} />
                <OmniOrb variant={variant} size={120} />
              </div>

              <div className="flex items-center gap-2.5 mt-2">
                <OmniOrb variant={variant} size={28} />
                <span className="om-wordmark text-sm" style={{ color: 'var(--om-text-0)' }}>
                  OMNIMARKET
                </span>
              </div>
            </div>

            {/* Light background test */}
            <div className="rounded-2xl border border-border bg-white p-6 flex flex-col items-center gap-4">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">on light</span>
              <div className="flex items-end gap-4">
                <OmniOrb variant={variant} size={32} />
                <OmniOrb variant={variant} size={64} />
              </div>
              <div className="flex items-center gap-2.5">
                <OmniOrb variant={variant} size={24} />
                <span className="om-wordmark text-xs text-neutral-900">OMNIMARKET</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
