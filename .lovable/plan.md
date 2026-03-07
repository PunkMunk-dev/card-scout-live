

## Plan: Improve Header Logo Visibility

The mono variant #6 at 22px has very thin, low-opacity concentric rings that vanish against the dark header. Two fixes:

### Changes

**Edit: `src/components/branding/OmniOrb.tsx`**
- In variant 6's mono mode, boost ring opacities significantly (from `0.2 + i * 0.1` to `0.5 + i * 0.12`)
- Increase ring stroke width for small sizes (from `size * 0.008` to `size * 0.02`)
- Boost center dot opacity to 1.0 and increase its size (from `r * 0.15` to `r * 0.2`)
- Increase glow opacity in mono mode for better backdrop presence

**Edit: `src/components/branding/BrandLockup.tsx`**
- Increase orb size from 22px to 26px for better visibility at header scale

### Files
- `src/components/branding/OmniOrb.tsx` — boost mono variant 6 visibility
- `src/components/branding/BrandLockup.tsx` — bump size from 22 to 26

