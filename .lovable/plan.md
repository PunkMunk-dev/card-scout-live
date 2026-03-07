

## Plan: Logo Showcase Page

Create a new `/logo-showcase` route displaying all 10 OmniOrb variants in a grid with labels for easy comparison.

### Changes

**New file: `src/pages/LogoShowcase.tsx`**
- Full-page dark grid showing all 10 orb variants at multiple sizes (40px, 80px, 160px)
- Each variant labeled with its number and name (OmniCore, Quantum, Neural Scan, etc.)
- Include horizontal lockup preview (orb + "OMNIMARKET" wordmark) for each variant
- Simple, clean layout with no distractions

**Edit: `src/App.tsx`**
- Add lazy-loaded route `/logo-showcase` pointing to the new page

### Files
- Create `src/pages/LogoShowcase.tsx`
- Edit `src/App.tsx` (add route)

