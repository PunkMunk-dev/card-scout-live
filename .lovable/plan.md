

# Remove $10 Minimum Price Filter

## Problem
The TCG Lab enforces a hidden $10 minimum price floor that filters out listings under $10, even when "all" prices are selected. This affects search functionality by silently excluding cheaper listings.

## Changes

### 1. `src/components/tcg-lab/TerminalView.tsx` (line 53)
Change `Math.max(10, priceRangeConfig.min)` to just `priceRangeConfig.min`, removing the forced $10 floor.

### 2. `src/components/tcg-lab/ResultsToolbar.tsx` (lines 14-15)
Update the "all" price range from `{ value: 'all', label: '$10+', min: 10, max: 0 }` to `{ value: 'all', label: 'All Prices', min: 0, max: 0 }` so listings at any price are included.

## No other files need changes
- Sports Lab (`EbayResultsPanel.tsx`) already has "All Prices" with `min: 0` -- no change needed.
- The edge function and service layer already handle `minPrice: 0` correctly (no filter applied when 0).

