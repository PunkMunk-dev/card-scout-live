
# Remove Gem Score Toggle and Functionality

## Summary

Remove the entire Gem Score/Gem Rate feature from the application, including the UI toggle, hooks, services, edge functions, and related database tables.

## Files to Delete

| File | Description |
|------|-------------|
| `src/types/gemScore.ts` | Type definitions for gem rate results and state |
| `src/hooks/useGemRates.ts` | Hook for managing gem rate calculations |
| `src/services/gemRateService.ts` | Service for calling gem rate edge function |
| `src/services/gradedPopService.ts` | Service for graded card population lookup |
| `src/services/psaPopulationService.ts` | Service for PSA population data fetching |
| `src/components/GemRateBadge.tsx` | Badge component displaying gem rate |
| `src/components/GemRateBreakdown.tsx` | Popover breakdown component |
| `supabase/functions/gem-rate/index.ts` | Edge function for gem rate calculation |
| `supabase/functions/graded-pop-lookup/index.ts` | Edge function for graded card lookup |
| `supabase/functions/psa-population-extract/index.ts` | Edge function for PSA data extraction |
| `supabase/functions/firecrawl-scrape/index.ts` | Edge function for Firecrawl scraping |

## Files to Modify

### 1. `src/pages/Index.tsx`
Remove gem score state, hook usage, and filter props:
- Remove `useGemRates` import and hook call
- Remove `gemScoreEnabled` state
- Remove gem score props from `SearchFilters` and `ListingGrid`

### 2. `src/components/SearchFilters.tsx`
Remove the Gem Score toggle section:
- Remove `Sparkles` icon import
- Remove `Tooltip` imports
- Remove gem score props from interface
- Remove the toggle switch and tooltip UI

### 3. `src/components/ListingGrid.tsx`
Remove gem score display:
- Remove `GemScoreState` type import
- Remove `gemScores` prop from interface
- Remove `gemScoreState` prop from `ListingCard`

### 4. `src/components/ListingCard.tsx`
Remove gem score badge display:
- Remove `GemRateBadge` import
- Remove `GemRateState` type import
- Remove `gemScoreState` prop from interface
- Remove the badge rendering in the card

### 5. `src/types/ebay.ts`
Remove `popData` field from `EbayItem` interface (optional - the data extraction can remain if useful for other purposes, or be removed entirely)

### 6. `supabase/config.toml`
Remove edge function configurations:
- Remove `gem-rate` function config
- Remove `graded-pop-lookup` function config
- Remove `psa-population-extract` function config
- Remove `firecrawl-scrape` function config

## Database Changes

The following tables will be dropped (requires migration):
- `historical_gem_rates` - Historical gem rate data
- `psa_population_cache` - PSA population cache

```sql
DROP TABLE IF EXISTS public.psa_population_cache;
DROP TABLE IF EXISTS public.historical_gem_rates;
```

## Edge Functions to Delete from Deployment

These functions need to be undeployed:
- `gem-rate`
- `graded-pop-lookup`
- `psa-population-extract`
- `firecrawl-scrape`

---

## Summary of Changes

**Deletions:** 11 files
**Modifications:** 6 files
**Database:** 2 tables dropped
**Edge Functions:** 4 functions removed

After these changes, the application will no longer have any gem score/rate functionality. The search and listing display will continue to work normally without the gem rate badges.
