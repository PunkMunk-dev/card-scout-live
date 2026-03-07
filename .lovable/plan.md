

## Plan: Set Variant #6 (Data Core) as Primary Logo in Black/White

### Changes

**1. Edit `src/components/branding/OmniOrb.tsx`**
- Add a `mono?: boolean` prop to `OmniOrbProps`
- When `mono` is true, replace the teal/blue gradient with a white/gray gradient scheme:
  - Core gradient: white → gray → black (instead of teal → blue → black)
  - Glow: white at low opacity (instead of teal)
  - Ring strokes: white and light gray (instead of teal and blue)
  - Center dot: white

**2. Edit `src/components/branding/OmniIcon.tsx`**
- Change `variant={1}` → `variant={6}`, add `mono`

**3. Edit `src/components/branding/OmniLogo.tsx`**
- Change `variant={1}` → `variant={6}`, add `mono`

**4. Edit `src/components/branding/BrandLockup.tsx`**
- Change `variant={1}` → `variant={6}`, add `mono`

**5. Edit `src/components/landing/LandingHero.tsx`**
- Change `variant={1}` → `variant={6}` (keep colored version for hero, or add `mono` — hero can stay colorful for impact)

### Files to edit
- `src/components/branding/OmniOrb.tsx` (add `mono` prop with alternate color palette)
- `src/components/branding/OmniIcon.tsx`
- `src/components/branding/OmniLogo.tsx`
- `src/components/branding/BrandLockup.tsx`
- `src/components/landing/LandingHero.tsx`

