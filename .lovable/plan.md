

## Plan: Fill Cloud with Subtle Grey Gradient

### What Changes

**File: `src/components/branding/OmniOrb.tsx`** (lines 540-668)

1. **Add a grey gradient definition** for the cloud fill — a subtle top-to-bottom gradient:
   - Dark/mono mode: `rgba(255,255,255,0.15)` → `rgba(255,255,255,0.05)` (soft white translucency)
   - Light mode: `rgba(0,0,0,0.08)` → `rgba(0,0,0,0.03)` (soft dark translucency)

2. **Update all 5 cloud variants (26–30)** — change the cloud `<path>` from `fill="none"` to `fill={cloudGradUrl}`, keeping the stroke for the outline. This matches the uploaded reference image which shows a solid filled cloud shape with a visible outline.

3. **Keep signal arcs as stroke-only** — unchanged, matching the reference.

### Specific Edits

- Around line 581: Add a `<defs>` block with a `linearGradient` for the cloud fill, using `mono` to pick white-based or dark-based fills
- Lines 586-668: In each variant's cloud `<path>`, replace `fill="none"` with `fill={url}` referencing the gradient, and slightly reduce stroke opacity so the fill is the primary visual

