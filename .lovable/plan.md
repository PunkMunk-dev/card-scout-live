

## Plan: 5 Structural Renditions of #22

Strip the showcase page to only show 5 new variants based on #22 (teal-to-blue gradient hex-knot with negative-space search). Each rendition repositions the search icon to the edge and introduces a significant structural change.

### Variant Changes (replace 21–25)

All share the teal→blue gradient fill on hex-knot bands. The search mask moves to the lower-right edge (lens near corner, handle extending outward/clipped). The search icon becomes smaller (~20% of radius vs current 28%) so it reads as a subtle detail rather than a focal element.

**Search icon repositioned**: Lens center moves to `cx + r*0.38, cy + r*0.38` (lower-right edge of the knot), radius reduced to `r * 0.18`, handle extends outward at 135° and gets clipped by the viewBox boundary.

Five structural variations:

1. **22a — Open Knot**: Hex-knot bands rendered as thick strokes (not filled), creating an open wireframe feel. Gradient strokes, subtle edge search cutout.

2. **22b — Broken Band**: One of the three bands has a gap/break near the search icon, as if the search is "cutting through" the geometry. The other two bands remain solid fills.

3. **22c — Rounded Knot**: All band corners use rounded joins and the band paths use quadratic curves instead of sharp angles — softer, more organic version of the geometric mark.

4. **22d — Layered Depth**: Bands rendered with varying opacity (back band at 40%, middle at 65%, front at 90%) creating a 3D layered depth effect. Subtle drop shadow on the front band.

5. **22e — Partial Fill**: Only the halves of each band nearest the search icon are filled; the far halves fade to stroke-only outlines, creating a reveal/scan effect radiating from the search point.

### Files to edit

- **`src/components/branding/OmniOrb.tsx`**: Replace variants 16–25 with 5 new variants (16–20 reassigned). Remove old hex-knot and search mask code, build new geometry for each rendition. Keep variants 1–15 untouched.

- **`src/pages/LogoShowcase.tsx`**: Remove all existing sections. Show a single section with the 5 new renditions. Update variant arrays and labels.

