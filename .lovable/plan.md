

## Plan: Add Sparkle (AI Symbol) to Split Sphere Logos

Add a 4-point sparkle shape inside each Split Sphere variant, positioned in the upper-right quadrant of the circle to suggest AI intelligence.

### Changes

**Edit: `src/components/branding/OmniOrb.tsx`**
- Create a reusable sparkle path helper that draws a 4-point star (classic AI sparkle) scaled relative to `size`
- Position it at roughly `cx + r*0.25, cy - r*0.25` (upper-right area)
- Use white fill with slight opacity so it reads on all gradient backgrounds
- Add the sparkle element to all 5 Split Sphere variants (11–15)
- Sparkle size ~`r * 0.35` to be visible but not dominant

### Sparkle Shape
A 4-point star built from a path with 8 points (4 tips + 4 inner pinch points), centered at a given position. Clean geometric shape, no animation.

### Files
- `src/components/branding/OmniOrb.tsx`

