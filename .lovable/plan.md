

## Plan: 5 Hexagonal Logo Variants on Logo Showcase

The uploaded image is a geometric hexagonal mark — interlocking angular strokes forming a cube/knot shape, white on black. I'll recreate this as an SVG path and produce 5 color/style variations as new OmniOrb variants 16–20.

### 1. Add variants 16–20 to `src/components/branding/OmniOrb.tsx`

Each variant renders the same hexagonal knot geometry (built from 3 interlocking parallelogram-style strokes) at the given `size`, with different color treatments:

- **16 — Mono White**: White strokes on transparent (classic mark)
- **17 — Teal Gradient**: Strokes use a linear gradient from #00E0C6 to #3B82F6
- **18 — Glow**: White strokes with a teal outer glow blur behind
- **19 — Duotone**: Alternating teal and blue strokes for each of the 3 interlocking bands
- **20 — Filled Hex**: Black filled hexagon background with white knot strokes on top

Update the `variant` type from `1–15` to `1–20`.

The hexagonal knot path will be computed relative to `cx`, `cy`, and `r` so it scales properly at all sizes.

### 2. Update `src/pages/LogoShowcase.tsx`

Add a second section below the existing Split Sphere grid showing variants 16–20 with the same card layout (dark card + light card, multiple sizes, wordmark lockup).

### Files to edit
- `src/components/branding/OmniOrb.tsx` — add variants 16–20, expand type
- `src/pages/LogoShowcase.tsx` — add hexagonal section

