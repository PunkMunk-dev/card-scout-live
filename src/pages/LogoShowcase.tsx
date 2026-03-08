import { OmniOrb } from '@/components/branding/OmniOrb';

const RENDITIONS: { variant: 21|22|23|24|25; name: string; desc: string }[] = [
  { variant: 21, name: 'Open Knot', desc: 'Gradient strokes, wireframe feel' },
  { variant: 22, name: 'Broken Band', desc: 'One band split by the search icon' },
  { variant: 23, name: 'Rounded Knot', desc: 'Softened curves, organic geometry' },
  { variant: 24, name: 'Layered Depth', desc: 'Varying opacity, 3D depth effect' },
  { variant: 25, name: 'Partial Fill', desc: 'Stroke fading to fill near search' },
];

export default function LogoShowcase() {
  return (
    <div className="min-h-screen bg-background p-8 md:p-12 space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Renditions of #22
        </h1>
        <p className="text-muted-foreground">
          Teal→Blue gradient hex-knot with subtle edge search cutout — 5 structural variations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        {RENDITIONS.map(({ variant, name, desc }) => (
          <div key={variant} className="flex flex-col gap-6">
            {/* Dark card */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center gap-5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                #{variant}
              </span>
              <h3 className="text-sm font-semibold text-foreground">{name}</h3>
              <p className="text-xs text-muted-foreground text-center">{desc}</p>

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
