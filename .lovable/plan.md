

## Plan: Animate and shrink sparkle

**Edit: `src/components/branding/OmniOrb.tsx`**
- Reduce sparkle size from `r * 0.35` to `r * 0.22`
- Add a gentle pulse animation to the sparkle path using SVG `<animate>` on opacity (cycling `0.5 → 1 → 0.5` over 3s)

### Changes
- Lines 43-47: Add `<animate>` child to the sparkle path and reduce opacity range
- All variant usages already call `sparkle(cx + r * 0.25, cy - r * 0.25, r * 0.35)` — update the size argument to `r * 0.22` in each variant (11–15)

