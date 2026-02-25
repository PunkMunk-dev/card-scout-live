

# UI/UX Evaluation and Improvement Plan

After reviewing all three pages (Home/Card Finder, TCG Lab, Sports Lab) on both desktop and mobile, here are the usability issues identified and proposed fixes.

---

## Issues Found

### 1. Redundant search on the Home page
The Home page (`/`) now has **two search bars** -- the compact one in the global header AND the large SearchBar component below it. This is confusing and redundant. Users see two places to type the same thing.

**Fix:** Remove the large standalone SearchBar section on the Home page. The header search already navigates to `/?q=` and triggers the same search. Keep the sort filters, WatchlistDropdown, and results grid. When landing on `/` with no query, show a welcoming empty state that points users to the header search bar.

### 2. Home page feels empty and purposeless without a search
When you land on `/` with no query, you see a big search bar and "No results found / Enter a card name to start searching" -- it feels like a dead end. The page doesn't guide users toward the TCG Lab or Sports Lab features either.

**Fix:** Replace the idle empty state with a more engaging landing that shows quick-action cards or links to TCG Lab and Sports Lab, making the home page a useful hub rather than just a search box.

### 3. Header search bar and Card Finder search bar fight for attention
On desktop, the header has "Search cards..." (compact) and below it the Card Finder has "Search any card (e.g., Charizard VMAX...)" (full-width). Two competing inputs.

**Fix:** This is resolved by fix #1 above -- removing the large SearchBar from the Home page body.

### 4. Mobile: Bottom nav has no visual label differentiation
The bottom nav shows "TCG", "Sports", "Search" -- all in the same style. The Search tab navigates to a different type of page (a search results view) vs the Labs (which are guided tools). There's no visual grouping.

**Fix:** Give the Search icon a slightly different treatment (e.g., a filled/outlined circle background) so it reads as a utility action rather than a peer tab.

### 5. Watchlist is inconsistent across pages
- Home page: WatchlistDropdown (popover with star icon, only shows when count > 0)
- TCG Lab: Star button in the sub-header (always visible)
- Sports Lab: Star button that opens a Sheet panel

Users have to learn three different watchlist patterns.

**Fix:** Unify the watchlist interaction. Move the watchlist star/badge into the global header next to the search bar so it's always accessible from any page. Remove per-page watchlist buttons.

### 6. Sub-headers create visual clutter with the global header
Both TCG Lab and Sports Lab have their own sticky sub-headers with rounded cards (`bg-card/80 backdrop-blur-md border-b border-border mx-2 mt-2 rounded-xl`). Combined with the global header, this creates two distinct bars stacked at the top -- consuming vertical space and looking heavy.

**Fix:** Tighten the sub-header styling: remove the top margin (`mt-2`), remove horizontal margin (`mx-2`), and drop the rounded corners so it reads as a natural extension of the global header rather than a floating card. This reclaims vertical space and creates visual continuity.

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Remove the large SearchBar section; show an engaging idle state with links to Labs; keep WatchlistDropdown in the toolbar row |
| `src/components/TabNavigation.tsx` | Add a watchlist star/badge to the header (right side, next to search); minor spacing tweaks |
| `src/components/tcg-lab/TcgHeader.tsx` | Remove `mx-2 mt-2 rounded-xl` from sub-header wrapper; remove per-page watchlist button |
| `src/components/sports-lab/QueryHeader.tsx` | Remove `mx-2 mt-2 rounded-xl` from sub-header wrapper; remove per-page watchlist button |
| `src/components/shared/GuidedSearchEmptyState.tsx` | No changes needed |

## Technical Details

### Home page idle state redesign
Replace the current empty `<EmptyState />` (when no search has happened) with a simple hub showing two cards:
```text
+---------------------------+---------------------------+
|   TCG Lab                 |   Sports Lab              |
|   Search Pokemon,         |   Search sports cards     |
|   One Piece cards         |   by player, brand        |
|   [Go to TCG Lab ->]      |   [Go to Sports Lab ->]   |
+---------------------------+---------------------------+
```
This makes `/` a useful starting point rather than a blank search page.

### Watchlist in global header
Add a star icon + badge counter next to the search input in the header. Clicking it opens a popover (reusing WatchlistDropdown logic). This gives consistent access from any page.

### Sub-header cleanup
Change from:
```
className="bg-card/80 backdrop-blur-md border-b border-border mx-2 mt-2 rounded-xl"
```
To:
```
className="bg-card/80 backdrop-blur-md border-b border-border"
```
This makes it flush with the global header for a cleaner, more professional look.

