

# Landing Hub Redesign: Full-Width 2-Column Layout

Replaces the narrow centered "postcard" hero with a full-width, structured, two-column landing page that feels shipped.

## Scope

- File: `src/pages/Index.tsx`, lines 324-490 (the idle/hub else branch)
- No changes to search logic, API calls, routing, result states, or any code above line 324

## New Import

Add `Search, Zap, Eye, ChevronRight` to the existing `lucide-react` import (line 4) for icons used in "How it works" and "Why OmniMarket" sections.

## New CSS

Add a `<style>` block inside the hub JSX for the marquee keyframe:

```css
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

## New Handlers

Add two simple handlers before the return statement:

- `handleFocusSearch`: calls `document.querySelector<HTMLInputElement>('input')?.focus()`
- `marketTilesRef = useRef<HTMLDivElement>(null)` + `handleExploreMarkets`: scrolls `marketTilesRef` into view

## JSX Structure (replaces lines 324-490)

### Outer wrapper
```
<div className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50">
  {/* glows + dot grid (kept) */}
  <div className="relative mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8 py-12 md:py-16">
    ...content...
  </div>
</div>
```

Full width, no rounded-3xl card border.

### A) Hero: 2-column grid

```
grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start
```

**Left column** (text-left on desktop):
1. Wordmark (OMNIMARKET / Cards) -- left-aligned on lg
2. Headline h1
3. Subtext p
4. Value chips (flex-wrap, justify-start on lg)
5. CTA row: two buttons
   - "Start with Search" (primary dark, calls handleFocusSearch)
   - "Explore Markets" (secondary outline, calls handleExploreMarkets)

**Right column** -- "Live Surface" card:
- `rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm p-5`
- Contains:

  **i) Marquee ticker** (Trending Now):
  - Heading "Trending Now"
  - `overflow-hidden` container
  - Inner flex with `animate-[marquee_18s_linear_infinite]`
  - Pills rendered twice for seamless loop

  **ii) Compact stat strip** (Live Market Pulse):
  - `grid grid-cols-3 gap-2`
  - Three small cards: TCG total, Sports total, "Updated X ago"
  - Skeleton states for loading, muted text for error

  **iii) Featured preview** (3 cards, not 6):
  - Heading "Featured Listings"
  - `grid grid-cols-2 lg:grid-cols-3 gap-2`
  - Show `hubFeatured.slice(0, 3)` with image + price + external link icon
  - Skeleton states (3 cards)
  - "View all live listings" text link at bottom (no-op anchor, just visual)

### B) Market Tiles (full-width, below hero grid)

- `ref={marketTilesRef}`
- `grid grid-cols-1 md:grid-cols-2 gap-4 mt-10`
- Each tile gets:
  - Accent top border: TCG = `border-t-2 border-cyan-400/40`, Sports = `border-t-2 border-blue-400/40`
  - Title, description
  - 3 bullet features: e.g. "Chase cards", "Set search", "Clean results" for TCG; "Player search", "Brand filter", "Gem rate" for Sports
  - CTA button with ArrowRight (kept from current)

### C) "How It Works" row

- `mt-10`
- `grid grid-cols-1 md:grid-cols-3 gap-4`
- Three cards with icon + step number + title + description:
  1. Search icon -- "Search or pick a market"
  2. Eye icon -- "Filter to clean listings"
  3. Zap icon -- "Watchlist and track opportunities"
- Styling: `rounded-2xl border border-slate-200 bg-white/70 p-5`

### D) "Why OmniMarket" row

- `mt-8`
- `grid grid-cols-1 md:grid-cols-3 gap-4`
- Three small cards:
  1. "Clean Results" -- "No lots, no duplicates"
  2. "Live Pricing" -- "Real-time eBay data"
  3. "Fast Discovery" -- "Find undervalued cards quickly"
- Same card styling as above

## Spacing

- Consistent `mt-8` / `mt-10` between major sections
- No excessive padding

## What does NOT change

- All code before line 324 (search logic, handlers, hub data loading, state, helpers)
- Results flow (toolbar, loading grid, error, listing grid, empty state)
- Routing, API calls, imports of search/watchlist modules
- `loadHubData`, cache logic, `performSearch`

