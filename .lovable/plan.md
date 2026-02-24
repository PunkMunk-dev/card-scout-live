

# Show Watchlisted Cards in Card Finder Search Area

## What Changes

1. **Card Finder (Index page)**: Add a starred-cards dropdown next to the search bar. When the user has watchlisted cards (from any lab), a star icon with a count badge appears beside the search input. Clicking it opens a dropdown showing thumbnail, title, and price of each watchlisted card with quick actions (remove, open on eBay, and "search this" to auto-populate the search bar with that card's title).

2. **Remove watchlist count badges from Sports and TCG tabs** in the tab navigation bar -- the counts will now live in the Card Finder search area instead.

3. **Remove the old WatchlistPanel button** from the Card Finder toolbar (the Heart button + Sheet). The new dropdown replaces it.

---

## Technical Details

### 1. New component: `src/components/WatchlistDropdown.tsx`

A Popover-based dropdown (using existing Radix Popover) that:
- Trigger: a Star icon button with a count badge (only renders when `watchlist.length > 0`)
- Content: a scrollable list of watchlist items showing image, title, price, remove button, external link, and a "Search" button that calls `onSearchItem(item.title)`
- Clear All button at the bottom
- Reads from `useSharedWatchlist()` for the unified watchlist

### 2. Update `src/pages/Index.tsx`

- Replace `<WatchlistPanel>` import with `<WatchlistDropdown>`
- Move the dropdown next to the SearchBar inside the search section (not the toolbar)
- Pass an `onSearchItem` callback that sets the query and triggers a search
- Remove WatchlistPanel from the toolbar row

### 3. Update `src/components/TabNavigation.tsx`

- Remove `WatchlistBadge` rendering for `sports` and `tcg` tabs (keep the badge for `cards` tab or remove all -- since the dropdown is now in the search area, remove all watchlist badges from tabs entirely)
- Remove `useTcgWatchlist` and `useSportsWatchlist` imports (no longer needed here)
- Simplify `useWatchlistCounts` -- remove it entirely since badges are gone

### 4. Update `src/components/SearchBar.tsx`

- Add an optional `initialQuery` prop so the parent can programmatically set the input value when a watchlist item is clicked
- Or alternatively, the parent can control the query externally -- simpler approach: make SearchBar accept a `value` prop alongside `onChange` to support controlled mode when searching from watchlist

### Files modified:
- `src/components/WatchlistDropdown.tsx` (new)
- `src/pages/Index.tsx` (swap WatchlistPanel for WatchlistDropdown, move next to search)
- `src/components/TabNavigation.tsx` (remove watchlist badges)
- `src/components/SearchBar.tsx` (support external query injection)

