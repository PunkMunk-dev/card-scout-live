
# Dark Premium Landing Redesign

Replaces the light hub section (lines 328-551) with a dark, two-column financial-app aesthetic. No changes to search logic, handlers, routing, or result states.

## Scope

- File: `src/pages/Index.tsx`, lines 328-551 (the idle/hub `else` branch)
- No other files modified

## Changes

### 1. Dark outer wrapper (replaces lines 328-333)

Replace the light gradient wrapper with:

```
<div className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
  {/* Grid texture */}
  <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
  {/* Cyan glow top-left */}
  <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
  {/* Blue glow bottom-right */}
  <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
```

### 2. Hero grid -- 12-column layout (replaces lines 343-475)

```
grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[80vh]
```

**Left column** (`lg:col-span-6`):
- Wordmark: `OMNIMARKET` (text-3xl font-semibold) + `Cards` (text-xs tracking-[0.35em] uppercase text-white/60)
- Headline: `text-4xl md:text-5xl font-semibold tracking-tight text-white` -- "Discover the market before it moves."
- Subtext: `text-slate-400 max-w-[480px]`
- Chips: `rounded-full bg-white/5 border border-white/10 text-xs px-3 py-1 text-slate-300`
- CTA row:
  - Primary: `bg-white text-slate-900 rounded-xl h-11 px-5 font-medium hover:bg-slate-200`
  - Secondary: `bg-white/5 border border-white/10 text-white rounded-xl h-11 px-5 hover:bg-white/10`

**Right column** (`lg:col-span-6`) -- Live Surface card:
- Card: `rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-2xl`
- Contains three sub-sections:

  **A) Trending ticker:**
  - Label: `text-xs uppercase tracking-[0.3em] text-slate-400`
  - Marquee row with `animate-[marquee_18s_linear_infinite]`, pills rendered twice
  - Pills: `bg-white/10 border border-white/10 rounded-full px-3 py-1 text-xs text-slate-200`

  **B) Live Stats:**
  - `grid grid-cols-3 gap-3 mt-6`
  - Each: `rounded-2xl bg-slate-900/70 border border-white/10 p-4 text-center`
  - Number: `text-xl font-semibold text-white`
  - Label: `text-xs text-slate-400 uppercase tracking-wide`
  - Skeleton states use dark-appropriate styling

  **C) Featured (3 cards max):**
  - `grid grid-cols-3 gap-3 mt-6`
  - Each: `rounded-xl bg-slate-900 border border-white/10 overflow-hidden hover:scale-[1.02] transition`
  - Image top, price + title bottom with dark text colors
  - Footer link: `text-xs text-slate-400 hover:text-white` -- "View all live listings"

### 3. Market tiles -- below hero (replaces lines 477-509)

- `mt-20 grid grid-cols-1 md:grid-cols-2 gap-6`
- Each tile: `rounded-3xl bg-white/5 border border-white/10 p-8 hover:bg-white/10 transition`
- Title: `text-lg font-semibold text-white`
- Description: `text-slate-400`
- Button: `mt-4 bg-white text-slate-900 rounded-xl h-10 px-4 font-medium`
- Remove bullet lists (`<ul>` blocks deleted)

### 4. Remove "How It Works" and "Why OmniMarket" sections (lines 511-549)

Delete these entirely. The spec calls for only 2 primary vertical sections (hero + market tiles). No clutter.

### 5. Marquee keyframes (line 334-339)

Keep the existing `<style>` block with the marquee keyframe -- just moves inside the new dark wrapper.

### 6. Spacing

- Hero section: `py-12 md:py-0` (vertically centered via `items-center min-h-[80vh]`)
- Market tiles: `mt-20` gap from hero
- Inner container: `mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8`
- Bottom padding: `pb-16`

## What does NOT change

- Lines 1-327 (imports, state, handlers, search logic, toolbar, result grid, error/empty states)
- `loadHubData`, cache logic, `performSearch`, routing
- `hubPulse`, `hubFeatured`, `hubLoading`, `hubError` state usage (just restyled)
- `marketTilesRef`, `handleFocusSearch`, `handleExploreMarkets` handlers
- No new files
