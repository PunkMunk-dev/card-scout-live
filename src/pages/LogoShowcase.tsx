import { OmniOrb } from '@/components/branding/OmniOrb';

const SPLIT_VARIANTS: { variant: 11|12|13|14|15; name: string; desc: string }[] = [
  { variant: 11, name: 'Black / Teal', desc: 'Linear gradient, dark to teal' },
  { variant: 12, name: 'Black / Blue', desc: 'Linear gradient, dark to blue' },
  { variant: 13, name: 'Teal / Blue', desc: 'Brand colors, no black' },
  { variant: 14, name: 'Radial Core', desc: 'Teal center fading to black' },
  { variant: 15, name: 'Triple Band', desc: 'Black → teal → blue banded' },
];

const HEX_VARIANTS: { variant: 16|17|18|19|20; name: string; desc: string }[] = [
  { variant: 16, name: 'Mono White', desc: 'White strokes on transparent' },
  { variant: 17, name: 'Teal Gradient', desc: 'Teal → blue gradient strokes' },
  { variant: 18, name: 'Glow', desc: 'White strokes with teal glow' },
  { variant: 19, name: 'Duotone', desc: 'Alternating teal & blue bands' },
  { variant: 20, name: 'Filled Hex', desc: 'Black hex bg with white knot' },
];

const SEARCH_VARIANTS: { variant: 21|22|23|24|25; name: string; desc: string }[] = [
  { variant: 21, name: 'White Cutout', desc: 'White bands, search negative space' },
  { variant: 22, name: 'Teal Gradient', desc: 'Gradient bands, search cutout' },
  { variant: 23, name: 'Glow Cutout', desc: 'Glowing bands, search negative space' },
  { variant: 24, name: 'On Black Hex', desc: 'Black hex bg, search reveals black' },
  { variant: 25, name: 'Duotone', desc: 'Teal/blue bands, search cutout' },
];

function VariantSection({ title, subtitle, variants }: { title: string; subtitle: string; variants: { variant: number; name: string; desc: string }[] }) {
  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">{title}</h2>
      <p className="text-muted-foreground mb-8">{subtitle}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        {variants.map(({ variant, name, desc }) => (
          <div key={variant} className="flex flex-col gap-6">
            {/* Dark card */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center gap-5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                #{variant}
              </span>
              <h3 className="text-sm font-semibold text-foreground">{name}</h3>
              <p className="text-xs text-muted-foreground">{desc}</p>

              <div className="flex items-end gap-4">
                <OmniOrb variant={variant as any} size={32} />
                <OmniOrb variant={variant as any} size={64} />
                <OmniOrb variant={variant as any} size={120} />
              </div>

              <div className="flex items-center gap-2.5 mt-2">
                <OmniOrb variant={variant as any} size={28} />
                <span className="om-wordmark text-sm" style={{ color: 'var(--om-text-0)' }}>
                  OMNIMARKET
                </span>
              </div>
            </div>

            {/* Light background test */}
            <div className="rounded-2xl border border-border bg-white p-6 flex flex-col items-center gap-4">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">on light</span>
              <div className="flex items-end gap-4">
                <OmniOrb variant={variant as any} size={32} />
                <OmniOrb variant={variant as any} size={64} />
              </div>
              <div className="flex items-center gap-2.5">
                <OmniOrb variant={variant as any} size={24} />
                <span className="om-wordmark text-xs text-neutral-900">OMNIMARKET</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LogoShowcase() {
  return (
    <div className="min-h-screen bg-background p-8 md:p-12 space-y-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Logo Renditions</h1>
        <p className="text-muted-foreground mb-10">All curated marks — minimal to expressive.</p>
      </div>

      <VariantSection
        title="Hexagonal Knot"
        subtitle="5 geometric hex-knot marks — the uploaded logo recreated as scalable SVG."
        variants={HEX_VARIANTS}
      />

      <VariantSection
        title="Split Sphere"
        subtitle="5 gradient sphere marks."
        variants={SPLIT_VARIANTS}
      />
    </div>
  );
}
