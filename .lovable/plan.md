

## Plan: 5 New Logo Renditions for Showcase

Replace the current 10-variant showcase with 5 curated logo renditions. One rendition is a pure black dot (minimal, no effects).

### Changes

**Edit: `src/components/branding/OmniOrb.tsx`**
- Expand variant type to include `11 | 12 | 13 | 14 | 15`
- Add 5 new variants:
  - **11: Black Dot** — Pure solid black circle, no glow, no gradients. Absolute minimal mark.
  - **12: Green Core** — Solid black circle with a green (#00E0C6) center dot. Current header style distilled.
  - **13: Ringed Dot** — Black filled circle with a single thin green ring around it.
  - **14: Split Sphere** — Half black / half dark-green gradient circle, modern two-tone mark.
  - **15: Beacon** — Black circle with a green top-highlight crescent (like light catching a sphere).

**Edit: `src/pages/LogoShowcase.tsx`**
- Replace the 10-variant grid with the 5 new renditions (variants 11–15)
- Update heading text
- Keep the same card layout: size ladder (32, 64, 120) + horizontal lockup with wordmark
- Additionally show each on both dark and light backgrounds to test versatility

### Files
- `src/components/branding/OmniOrb.tsx` — add variants 11–15
- `src/pages/LogoShowcase.tsx` — showcase the 5 new renditions

