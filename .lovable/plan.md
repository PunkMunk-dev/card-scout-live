

# Redesign Header: Arena Club Style Layout

## What stays the same (all current Card Finder functionality preserved)

- The Card Finder page (`/`) keeps its full SearchBar, WatchlistDropdown, sort filters, results grid, load more, error handling, empty states -- everything
- URL persistence with `?q=` continues to work
- Watchlist "search from watchlist" continues to work
- The SearchBar component is unchanged

## What changes

### Header layout (desktop)

```text
|  OmniMarket Cards    TCG Lab    Sports Lab           [ Search cards...  🔍 ]  |
```

- "Card Finder" is removed as a navigation tab (you access it via the search bar instead)
- TCG Lab and Sports Lab tabs move closer to the brand name
- A compact search input is added on the right side of the header

### How the header search works

- Type a query and press Enter
- It navigates to `/?q=your+search` using React Router
- The Card Finder page picks up the `?q=` param and auto-searches (existing behavior)
- If you're already on `/`, the SearchBar syncs with the URL and searches immediately

### Mobile bottom nav

- Two tabs: TCG and Sports
- A search icon tab that navigates to `/` (the Card Finder page with its full search UI)

## Technical changes

### 1. `src/components/TabNavigation.tsx`
- Remove "Card Finder" from the `tabs` array
- Add a compact inline search form on the right side of the desktop header
  - Uses `useNavigate` to go to `/?q=term` on submit
  - Small input with search icon, no submit button (Enter to search)
- On mobile bottom nav: replace Card Finder tab with a Search icon that navigates to `/`
- If user is already on `/`, the navigation triggers the existing `?q=` flow

### 2. `src/pages/Index.tsx`
- **No functional changes** -- the page keeps its full SearchBar and all existing logic
- The only tweak: listen for URL `?q=` changes (not just on mount) so that when the header search navigates to `/?q=newterm` while already on `/`, the search triggers
  - Currently `initialQuery` is read once on mount; we add a `useEffect` watching `searchParams.get('q')` to handle re-navigation

