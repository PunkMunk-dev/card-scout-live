

# Hub Enhancements: Live Pulse, Featured Listings, and Dynamic Trending

This plan adds three new sections to the landing hub and makes Trending Now dynamic -- all within `src/pages/Index.tsx` only.

## Overview

- **Live Market Pulse** -- two stat cards showing TCG and Sports listing totals from real eBay data
- **Featured Live Listings** -- a grid of 6 real cards with images, titles, and prices
- **Dynamic Trending** -- pills populated from recent user searches first, then curated fallbacks
- **Recent search tracking** -- one localStorage write per search

## Technical Details

### 1. Helper functions (below `deriveBuyingOptions`, before the component)

Add three utility blocks:

- `RECENT_SEARCHES_KEY` constant and `pushRecentSearch(term)` -- writes to localStorage, dedupes, caps at 12
- `getTrendingLabels()` -- merges recent searches (as "term -- Trending") with curated pills, returns up to 10
- `Skeleton` import from `@/components/ui/skeleton` (already exists in project)

### 2. One line added to `performSearch`

After the `if (!searchQuery.trim()) return;` guard (line 56), add:

```
pushRecentSearch(searchQuery);
```

No other changes to `performSearch`.

### 3. Hub state and cache helpers (inside the component, near existing `useState` calls)

New state:
- `hubPulse: { tcgTotal: number; sportsTotal: number; updatedAt: number } | null`
- `hubFeatured: EbayItem[]` (same type as `items`)
- `hubLoading: boolean`
- `hubError: string | null`

Cache helpers (`readHubCache`, `writeHubCache`, `minutesAgo`) using localStorage with a 60-second TTL key `omni_hub_cache_v1`.

### 4. `loadHubData()` function

Uses the existing `searchEbay` function (from `@/lib/ebay-api`) to make 3 lightweight calls:

| Call | Query | Limit | Extracts |
|------|-------|-------|----------|
| TCG pulse | `pokemon OR "one piece"` | 1 | `response.total` |
| Sports pulse | `panini OR topps` | 1 | `response.total` |
| Featured | `rookie OR chrome OR holo` | 6 | `response.items` |

Results are cached via `writeHubCache`. On failure: sets `hubError`, no toast.

### 5. Hub-loading `useEffect`

Triggers only when the idle hub is visible:
- `!isLoading && !error && items.length === 0 && !query`

Checks cache first; if valid, hydrates state from cache. Otherwise calls `loadHubData()`.

Dependencies: `[isLoading, error, items.length, query]`

### 6. JSX changes (lines 202-291 idle block only)

**A) Live Market Pulse** (inserted after value chips, before market tiles)

- Section heading: "LIVE MARKET PULSE" (same tracking/uppercase style as "Trending Now")
- Two side-by-side stat cards showing `hubPulse.tcgTotal` and `hubPulse.sportsTotal` formatted with `toLocaleString()`
- "Updated {minutesAgo(...)}" muted timestamp
- Loading state: 2 skeleton rectangles
- Error state: muted italic text "Live preview unavailable."

**B) Featured Live Listings** (inserted after market tiles, before Trending Now)

- Section heading: "FEATURED LIVE LISTINGS"
- Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3`
- Each card: image, 2-line-clamped title, price, "View" link (`target="_blank"`)
- Styled consistently: `rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm`
- Loading state: 6 skeleton cards
- Empty state: muted fallback text

**C) Trending Now** -- replace static array with `getTrendingLabels()` call

The pills remain styled identically but are now driven by the dynamic function.

### What does NOT change

- No new files, routes, or API endpoints
- Results flow (toolbar, loading, error, grid, empty states) untouched
- `performSearch` logic unchanged except the one `pushRecentSearch` line
- Market tile links (`/tcg`, `/sports`) stay identical
- No toasts for hub failures

