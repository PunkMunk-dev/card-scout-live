

# Add Reset/Refresh Button to Filter Bar

## Test Results
All 3 features work correctly:
- **Tab switching**: All/TCG/Sports tabs update Suggested Lanes and Popular Searches dynamically
- **Chip clicks**: Clicking a chip populates the search bar and runs the search immediately (verified with "NBA Rookies" → 48 results)
- **Sort labels**: "Sort: Best ROI" dropdown with all 7 options renders correctly

## Planned Change: Add Reset Filters Button

### `src/components/scanner/StickyFilterBar.tsx`
Add a small refresh/reset button (using `RotateCcw` icon from lucide) at the end of the filter row. When clicked:
1. Reset all filters to `DEFAULT_FILTERS` (preserving the current `marketMode`)
2. Reset sort to `bestOpportunity`
3. If a search is active, re-run it with the reset filters

The button only appears when filters have been modified from their defaults (i.e., listing type changed, toggles activated, price range set, or sort changed).

### `src/hooks/useScannerState.ts`
No new action needed — the component will dispatch `UPDATE_FILTERS` with `DEFAULT_FILTERS` (keeping current `marketMode`) and `SET_SORT` with `bestOpportunity`.

### Files Changed
- `src/components/scanner/StickyFilterBar.tsx` — add conditional reset button with `RotateCcw` icon

