

## Plan: Default Auction Sorting to "Ending Soonest" Across the App

### Summary
When auctions are shown anywhere in the app, they should default to sorting by "ending soonest." The TCG Lab and Sports Lab already do this when their auction filter is toggled. The Card Finder (Index page) does not — it lacks an "Ending Soonest" sort option entirely, and the `ebay-search` edge function ignores sort values.

### Changes

**1. Add "Ending Soonest" sort to Card Finder types and UI**
- `src/types/ebay.ts`: Add `'ending_soonest'` to the `SortOption` union type.
- `src/components/SearchFilters.tsx`: Add an "Ending Soonest" `<SelectItem>`.

**2. Wire up sort in `ebay-search` edge function**
- `supabase/functions/ebay-search/index.ts` (line ~257): Update `getSortParam()` to return `'endingSoonest'` when sort is `'ending_soonest'` or `'auction_only'`, instead of always returning `'bestMatch'`.

**3. Auto-select "Ending Soonest" when auction filter is active on Card Finder**
- `src/pages/Index.tsx`: When user selects `auction_only`, auto-switch sort to `ending_soonest`. Update `deriveBuyingOptions()` to handle the new sort value. When switching away from auction, revert to `best`.

**4. Client-side fallback sort for auction listings**
- In the Card Finder results, when sort is `ending_soonest`, also sort client-side by `endDate` ascending (ending soonest first) as a safety net, since `endDate` is already present on `EbayItem`.

### Files to edit
- `src/types/ebay.ts`
- `src/components/SearchFilters.tsx`
- `supabase/functions/ebay-search/index.ts` (line 257-259)
- `src/pages/Index.tsx`

