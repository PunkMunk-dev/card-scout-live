

## Plan: Fix Favicon with Proper Cloud Eye SVG

### Problem
The current favicon.png was generated as a binary file that doesn't match the Cloud Eye design. The cloud shape in the reference image has three very distinct, large, round puffs — much puffier than the current SVG geometry.

### Changes

**1. `public/favicon.svg`** — Create a standalone SVG favicon
- Hand-craft an SVG matching the reference: green (#6FBA2C) puffy cloud with white eye ring and green center dot
- Three large circular bumps on top, flat bottom, centered "O" eye
- This renders crisply at all sizes (16px, 32px, etc.)

**2. `index.html`** — Point favicon to the new SVG
- Change `<link rel="icon" href="/favicon.png">` to `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`

**3. `src/components/branding/OmniOrb.tsx`** — Improve variant 31 cloud geometry
- The current cloud path is too small and angular — doesn't match the reference image's large, round, puffy 3-bump shape
- Rewrite the cloud path in variant 31 to use wider, rounder cubic bezier curves with three distinct dome-shaped bumps
- Increase `cw` and `ch` so the cloud fills more of the viewBox
- Move the eye center to match the visual center of the wider cloud

