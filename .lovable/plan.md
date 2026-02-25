

# Add Visual Indicator for Cleaned Search Query

## Overview
When a user searches from the watchlist, the raw eBay title gets cleaned and truncated by `extractSearchQuery()`. Currently there's no visual feedback showing what was actually searched. We'll add a small indicator in the results toolbar so users understand the query transformation.

## Changes

### 1. Track watchlist-origin searches (`src/pages/Index.tsx`)
- Add a `fromWatchlist` state boolean, set to `true` when the search originates from a watchlist click (detected via a URL param like `&src=wl`)
- Display a small badge/chip below the toolbar when `fromWatchlist` is true, showing: "Searched: [cleaned query]" with an info tooltip explaining "Query cleaned from listing title for broader results"
- Reset `fromWatchlist` when a manual search is performed

### 2. Pass source param from watchlist navigation (`src/components/TabNavigation.tsx`)
- Update the `onSearchItem` callback to append `&src=wl` to the URL:
  ```
  navigate(`/?q=${encodeURIComponent(title)}&src=wl`)
  ```

### 3. Add the visual indicator in the toolbar area (`src/pages/Index.tsx`)
- In the toolbar section (around line 168-180), when `fromWatchlist` is true, render a small dismissible chip:
  ```
  Showing results for "cleaned query" (from starred card)  [x]
  ```
- Styled as a subtle info bar with a Sparkles or Star icon, muted background, and a dismiss button
- Automatically clears when user types a new manual search

## Technical Details

| File | Change |
|------|--------|
| `src/components/TabNavigation.tsx` | Append `&src=wl` to watchlist search URL |
| `src/pages/Index.tsx` | Read `src` param, show cleaned-query indicator chip, clear on manual search |

No new dependencies needed. Uses existing UI primitives (Badge, X icon).
