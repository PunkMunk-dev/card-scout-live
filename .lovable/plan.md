
# Landing Page Premium Polish

## Overview
Add subtle depth, animation, and controlled accent refinements to the landing page hero, navigation, CTAs, and market tiles. UI-only -- no logic changes.

## Files to Modify (2 files)

### 1. `src/index.css` -- Add tokens + animation

- Add CSS custom properties under `:root`:
  - `--accent-cyan: #00B9FF`
  - `--accent-blue: #0A84FF` (Apple iMessage blue)
  - `--focus-ring: rgba(10,132,255,0.20)`

- Add `@keyframes omniSpotPulse` for hero spotlight slow pulse (10s cycle, subtle opacity + scale shift)

- Add `.omni-hero-spotlight` utility class:
  - Absolute positioned radial gradient (cyan center fading to blue then transparent)
  - `filter: blur(22px)`, `opacity: 0.9`, animates with `omniSpotPulse`

### 2. `src/pages/Index.tsx` -- Hero + CTA + Tile polish (Idle/Hub block only)

**Hero Spotlight:**
- Add `<div className="omni-hero-spotlight" />` as first child inside the hero wrapper (the `relative overflow-hidden` dark container at line 241)

**CTA Polish:**
- "Start Searching" button: add glow shadow `shadow-[0_10px_30px_rgba(255,255,255,0.08),0_0_60px_rgba(0,185,255,0.12)]`
- "Explore Markets" button: strengthen border to `border-white/12`, add `hover:bg-white/10`

**Market Tile Depth:**
- Base: `bg-white/5 border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.45)]`
- Hover: `-translate-y-[3px]` (up from current 0.5), `border-white/15`, `shadow-[0_25px_70px_rgba(0,0,0,0.55)]`
- Tile inner buttons: add weaker version of CTA glow shadow

### 3. `src/components/TabNavigation.tsx` -- Nav depth polish

- Desktop header: add `shadow-[0_1px_0_rgba(255,255,255,0.06)]` for hairline depth
- Search input focus: change ring color to `var(--focus-ring)` (iMessage blue) and border to `rgba(255,255,255,0.16)`
- Active tab indicator: use `--accent-blue` for active tab border/background tint

## What Is NOT Changed
- No routing, API, search, filtering, sorting, or pagination changes
- No new dependencies
- Mobile bottom nav stays as-is
- All button click handlers unchanged
