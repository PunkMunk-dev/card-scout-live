
# Add "Ending Soon" Sort Option

## Summary

Add an "Ending Soon" option to the "Sort by" dropdown that shows auction listings ending soonest. The `end_soonest` value already exists in the `SortOption` type -- it just needs to be wired up in the UI and edge function.

## Changes

### 1. Add dropdown option (`src/components/SearchFilters.tsx`)

Add a new `SelectItem` for "Ending Soon" using the existing `end_soonest` value, placed after "Buy It Now Only":

```
<SelectItem value="end_soonest">Ending Soon</SelectItem>
```

### 2. Update buying format derivation (`src/pages/Index.tsx`)

Map `end_soonest` to `AUCTION` buying format since only auctions have end times:

```typescript
function deriveBuyingOptions(sort: SortOption): 'ALL' | 'AUCTION' | 'FIXED_PRICE' {
  if (sort === 'auction_only') return 'AUCTION';
  if (sort === 'buy_now_only') return 'FIXED_PRICE';
  if (sort === 'end_soonest') return 'AUCTION';
  return 'ALL';
}
```

### 3. Edge function already supports it

The `getSortParam` function in `supabase/functions/ebay-search/index.ts` already maps `end_soonest` to `endingSoonest`, and the filtering logic already treats it as default (raw-only). We need to update the filtering so `end_soonest` shows all cards (graded + raw) since users looking at ending auctions want to see everything.

Update the filtering block to include `end_soonest` alongside `auction_only`, `buy_now_only`, and `price_asc`:

```
} else if (sort === 'auction_only' || sort === 'buy_now_only' || sort === 'price_asc' || sort === 'end_soonest') {
  // Show ALL cards (both graded and raw)
}
```

### 4. Deploy edge function

Redeploy `ebay-search` with the updated filtering.
