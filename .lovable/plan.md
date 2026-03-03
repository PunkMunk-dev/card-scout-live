

# Add Pagination to Top ROI Page

## Problem
The Top ROI page renders all 1,879 cards at once, which is slow. Need pagination or infinite scroll for better performance.

## Approach
Add client-side pagination with a "Load more" button (consistent with the pattern used in `TerminalGrid` and `EbayResultsPanel`). Show 40 cards initially, load 40 more on each click.

## Changes

**`src/pages/TopRoi.tsx`**
- Add a `visibleCount` state (default 40), reset to 40 when sport/search/sort changes
- Slice `filteredAndSorted` to `visibleCount` for rendering
- Add a "Load more" button below the grid when there are more cards (reuse the existing `om-btn` style, matching `TerminalGrid` pattern)
- Update results count to show "showing X of Y cards"

No new files, no backend changes, no new dependencies. Single file edit.

