

## Plan: Implement Cloud Eye Logo Across the App

### What the Image Shows

A "Cloud Eye" mark: a puffy cloud shape with a centered circular "eye" (outer ring + inner dot). Two modes:
- **Light mode**: Green cloud (#6FBA2C) fill, white eye ring with green outline, white center dot
- **Dark mode**: White cloud fill, green eye ring, white center dot

### Changes

**1. `src/components/branding/OmniOrb.tsx`**

Add variant **31** — "Cloud Eye":
- Puffy cloud path (reuse existing `cloudPath` geometry but with solid fill instead of gradient)
- Centered eye: circle ring + inner dot
- Light mode (`mono=false`): cloud fill `#6FBA2C`, eye ring stroke white with green border, center dot white
- Dark/mono mode (`mono=true`): cloud fill `#FFFFFF`, eye ring stroke `#6FBA2C`, center dot white

**2. Update all brand references from variant 6 → 31:**

- `src/components/branding/OmniIcon.tsx` — line 9: variant 6 → 31
- `src/components/branding/OmniLogo.tsx` — line 10: variant 6 → 31
- `src/components/branding/BrandLockup.tsx` — line 11: variant 6 → 31
- `src/components/landing/LandingHero.tsx` — line 38: variant 6 → 31

**3. `src/pages/LogoShowcase.tsx`**

Add the Cloud Eye as a featured variant at the top of the showcase page.

### SVG Geometry (Variant 31)

```text
Cloud shape: solid filled puffy cloud (3 bumps)
Eye position: centered (cx, cy) offset slightly up into cloud body
  - Outer ring: r * 0.22 radius, stroke-width sw*1.5
  - Inner dot: r * 0.08 radius, solid fill
```

Colors:
- `mono=false` (light): cloud=#6FBA2C, ring stroke=white, dot=white
- `mono=true` (dark): cloud=#FFFFFF, ring stroke=#6FBA2C, dot=white, ring fill=white

