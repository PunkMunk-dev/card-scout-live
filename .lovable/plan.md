

# Performance Optimization Plan

## Identified Bottlenecks

1. **WatchlistContext causes full re-renders** — `isInWatchlist` uses `.some()` (O(n) per card), and `toggleWatchlist` depends on the `watchlist` array reference, so every watchlist change re-renders every card on screen.

2. **Double filtering in TCG pipeline** — `tcgEbayService.ts > filterListings()` filters listings, then `TerminalView > filterTcgListings()` filters them again with stricter logic. The first pass is wasted work.

3. **`normalizeTitle` in tcgFilters.ts** — Creates a new `RegExp` object per stop word per listing. With ~15 stop words × hundreds of listings, that's thousands of regex compilations per search.

4. **Card components not memoized** — `TerminalCard` and `EbayListingCard` re-render on every parent state change (sort, filter toggle, watchlist change) even when their own props haven't changed.

5. **TerminalCard emoji regex runs every render** — 5 chained `.replace()` calls on every render, not memoized.

---

## Changes

### 1. WatchlistContext — Use a Set for O(1) lookups, stabilize references
- Maintain a `Set<string>` of item IDs alongside the array
- Make `isInWatchlist` use the Set (O(1) instead of O(n))
- Remove `watchlist` from `toggleWatchlist` dependency to stabilize the callback reference
- This alone prevents cascade re-renders of all cards when any watchlist item changes

### 2. Remove redundant filtering in `tcgEbayService.ts`
- Remove the `filterListings()` and `sortListings()` calls from `searchActiveListings`
- Return raw items directly — `TerminalView` already does thorough filtering via `filterTcgListings` + `dedupeTcgListings`
- Eliminates duplicate iteration over every listing

### 3. Pre-compile stop word regexes in `tcgFilters.ts`
- Move the `STOP_WORDS` regex array creation outside `normalizeTitle` so regexes are compiled once at module load, not per-call

### 4. Memoize card components with `React.memo`
- Wrap `TerminalCard` with `React.memo` — it only depends on `listing` prop
- Wrap `EbayListingCard` with `React.memo` — compare by `listing.itemId`
- Wrap `GemRateBadge` with `React.memo`
- This prevents re-rendering cards that haven't changed when the parent re-renders due to sort/filter changes

### 5. Memoize TerminalCard title cleaning with `useMemo`
- Move the 5 emoji-stripping regex calls into a `useMemo` keyed on `listing.title`

---

## What stays intact
- All search functionality (eBay queries, pagination, load-all)
- All filtering logic (hard excludes, damaged, graded, image quality, dedup)
- All sorting options
- Watchlist add/remove/persist
- GemRate badge lazy loading via IntersectionObserver
- PSA 10 sold comps
- Auction countdown timers
- All UI controls and toolbar options

