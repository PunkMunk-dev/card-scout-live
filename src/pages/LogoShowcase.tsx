import { OmniOrb } from '@/components/branding/OmniOrb';

const RENDITIONS: { variant: 21|22|23|24|25; name: string; desc: string }[] = [
  { variant: 21, name: 'Open Knot', desc: 'Gradient strokes, wireframe feel' },
  { variant: 22, name: 'Broken Band', desc: 'One band split by the search icon' },
  { variant: 23, name: 'Rounded Knot', desc: 'Softened curves, organic geometry' },
  { variant: 24, name: 'Layered Depth', desc: 'Varying opacity, 3D depth effect' },
  { variant: 25, name: 'Partial Fill', desc: 'Stroke fading to fill near search' },
];

const CLOUD_EYE: { variant: 31; name: string; desc: string }[] = [
  { variant: 31, name: 'Cloud Eye', desc: 'Solid cloud with centered eye mark' },
];

const CLOUD_SERIES: { variant: 26|27|28|29|30; name: string; desc: string }[] = [
  { variant: 26, name: 'Cloud Core', desc: 'Minimal cloud outline with signal arcs' },
  { variant: 27, name: 'Cloud Pulse', desc: 'Animated pulsing signal waves' },
  { variant: 28, name: 'Cloud Lens', desc: 'Search lens integrated at signal origin' },
  { variant: 29, name: 'Cloud Ring', desc: 'Cloud inside a circular boundary ring' },
  { variant: 30, name: 'Cloud Node', desc: 'Signal arcs with connected node dots' },
];

function VariantCard({ variant, name, desc }: { variant: any; name: string; desc: string }) {
  return (
    <div className="flex flex-col gap-6">
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
          <OmniOrb variant={variant} size={32} mono={false} />
          <OmniOrb variant={variant} size={64} mono={false} />
        </div>
        <div className="flex items-center gap-2.5">
          <OmniOrb variant={variant} size={24} mono={false} />
          <span className="om-wordmark text-xs text-neutral-900">OMNIMARKET</span>
        </div>
      </div>

      {/* Mono (white on dark) test */}
      <div className="rounded-2xl border border-border bg-neutral-950 p-6 flex flex-col items-center gap-4">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">mono</span>
        <div className="flex items-end gap-4">
          <OmniOrb variant={variant} size={32} mono />
          <OmniOrb variant={variant} size={64} mono />
        </div>
        <div className="flex items-center gap-2.5">
          <OmniOrb variant={variant} size={24} mono />
          <span className="om-wordmark text-xs text-white">OMNIMARKET</span>
        </div>
      </div>
    </div>
  );
}

export default function LogoShowcase() {
  return (
    <div className="min-h-screen bg-background p-8 md:p-12 space-y-16">
      {/* Cloud Eye — Featured */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Cloud Eye — Active Logo
        </h1>
        <p className="text-muted-foreground">The current app icon used across all surfaces.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        {CLOUD_EYE.map(({ variant, name, desc }) => (
          <VariantCard key={variant} variant={variant} name={name} desc={desc} />
        ))}
      </div>

      {/* Cloud Signal Series */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          Cloud Signal Series
        </h1>
        <p className="text-muted-foreground">
          Greyscale cloud + signal-wave marks — theme-aware for light &amp; dark mode.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        {CLOUD_SERIES.map(({ variant, name, desc }) => (
          <VariantCard key={variant} variant={variant} name={name} desc={desc} />
        ))}
      </div>

      {/* Existing Hex Knot Series */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          Renditions of #22
        </h2>
        <p className="text-muted-foreground">
          Teal→Blue gradient hex-knot with subtle edge search cutout — 5 structural variations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        {RENDITIONS.map(({ variant, name, desc }) => (
          <VariantCard key={variant} variant={variant} name={name} desc={desc} />
        ))}
      </div>
    </div>
  );
}
