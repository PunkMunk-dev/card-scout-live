

## Plan: Negative-Space Search Icon Logo Variants

The uploaded image shows a hexagonal geometric mark where the negative space between the interlocking shapes forms a magnifying glass silhouette. I'll create 5 new variants (21-25) that use this technique — the hex-knot geometry is arranged so the gap between bands reads as a search/magnifying glass icon.

### Approach

The design uses:
1. A filled hexagonal background shape
2. The hex-knot ribbon bands rendered as **filled shapes** (not strokes) that act as the "positive" mass
3. A magnifying glass shape (circle + angled handle line) **cut out** from the ribbons using an SVG `<mask>` — the search icon appears as negative space where the background shows through

### 1. Add variants 21-25 to `src/components/branding/OmniOrb.tsx`

Expand variant type to include `21 | 22 | 23 | 24 | 25`.

Each variant renders filled hex-knot bands with a magnifying glass mask cut out of the center:

- **21 — Negative Search White**: White filled bands on transparent, search icon cut out as negative space
- **22 — Negative Search Teal Gradient**: Teal-to-blue gradient filled bands, search cutout
- **23 — Negative Search Glow**: White filled bands with teal glow, search cutout
- **24 — Negative Search on Black Hex**: Black hex background, white filled bands, search cutout reveals black
- **25 — Negative Search Duotone**: Alternating teal/blue filled bands, search cutout

The magnifying glass mask geometry:
- Circle centered slightly above-left of center (offset ~15% up-left), radius ~30% of `r`
- Handle line extending from circle at ~135° angle (toward bottom-right), length ~25% of `r`
- Both rendered as a combined path used in an SVG `<mask>` element

### 2. Update `src/pages/LogoShowcase.tsx`

Add a new `VariantSection` for "Negative Space Search" showing variants 21-25 with the same card layout.

### Files to edit
- `src/components/branding/OmniOrb.tsx` — add variants 21-25, expand type
- `src/pages/LogoShowcase.tsx` — add negative-space section

