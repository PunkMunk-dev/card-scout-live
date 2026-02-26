

# Fix Card Finder: Auto-filter Graded, Fix Auctions, Add "Graded" Mode

## Summary
Three changes to the main Card Finder (Index page search):
1. **Auto-filter graded cards** -- By default, all search modes (Best Match, Price, Auction, Buy It Now) will exclude graded/slabbed cards so only raw singles appear.
2. **Rename "Ungraded" to "Graded"** -- The filter option flips: selecting "Graded" will show ONLY graded cards instead.
3. **Fix auction pulls** -- Ensure auction listings return properly alongside the grading filter.

## Technical Changes

### 1. `src/types/ebay.ts` (line 36)
Replace `'raw'` with `'graded'` in the `SortOption` type.

### 2. `src/components/SearchFilters.tsx` (line 20)
Change the dropdown option from `value="raw"` / `Ungraded` to `value="graded"` / `Graded`.

### 3. `supabase/functions/ebay-search/index.ts` (lines 489-494)
Update the filtering logic so that:
- When sort is `'graded'`: show only graded cards (already works, no change).
- For ALL other sort modes (`best`, `price_asc`, `auction_only`, `buy_now_only`): filter OUT graded cards automatically. Currently lines 492-494 skip grading filters for auction/BIN/price sorts -- this will be changed to always exclude graded unless `sort === 'graded'`.

The updated logic block (replacing lines 489-494):

```text
} else {
  // Default: filter OUT graded cards for all other modes
  normalizedItems = normalizedItems.filter(item => !isGradedItem(item.title, item.condition));
}
```

This ensures auctions, BIN, price sort, and best match all show only raw cards by default, and the "Graded" option is the only way to see slabbed cards.

