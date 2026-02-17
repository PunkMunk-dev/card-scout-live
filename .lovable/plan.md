

# Merge Buying Options into Sort Dropdown

## Summary

Remove the separate "Buying Format" toggle group and the "Include lots/boxes" toggle. Instead, consolidate everything into a single "Sort by" dropdown with all options available at once. Lots/boxes will always be filtered out (already the default behavior in the edge function).

## Changes

### 1. Update Types (`src/types/ebay.ts`)

- Add `'auction_only'` and `'buy_now_only'` to `SortOption`
- Remove `BuyingOption` type (no longer needed)
- Remove `includeLots` from `SearchParams`

New SortOption: `'best' | 'price_asc' | 'end_soonest' | 'raw' | 'auction_only' | 'buy_now_only'`

### 2. Simplify SearchFilters (`src/components/SearchFilters.tsx`)

- Remove the "Buying Format" toggle group section entirely
- Remove the "Include lots/boxes" switch entirely
- Remove props: `buyingOption`, `onBuyingOptionChange`, `includeLots`, `onIncludeLotsChange`
- Single "Sort by" dropdown with all options:
  - Best Match
  - Price: Low-High
  - Auction Only
  - Buy It Now Only
  - Raw Cards

### 3. Simplify Index Page (`src/pages/Index.tsx`)

- Remove `buyingOption` and `includeLots` state variables
- Remove `handleBuyingOptionChange` and `handleIncludeLotsChange` handlers
- Derive `buyingOptions` from the sort value when calling the API:
  - `'auction_only'` or `'raw'` maps to `buyingOptions: 'AUCTION'`
  - `'buy_now_only'` maps to `buyingOptions: 'FIXED_PRICE'`
  - Everything else maps to `buyingOptions: 'ALL'`
- Always pass `includeLots: false`
- Update SearchFilters usage to only pass `sort` and `onSortChange`

### 4. Update Edge Function (`supabase/functions/ebay-search/index.ts`)

- Add `'auction_only'` and `'buy_now_only'` to the sort type
- Map both to `'bestMatch'` in `getSortParam`
- Add `FIXED_PRICE` handling in the buying options filter (already partially supported)
- The `includeLots` parameter can remain but defaults to false; junk filtering already always runs

## Technical Details

The `SearchParams` interface will derive the `buyingOptions` filter from the sort selection:

```text
Sort Selection     -> API buyingOptions  -> API sort
-----------------  -------------------  ----------
Best Match         -> ALL               -> bestMatch
Price: Low-High    -> ALL               -> bestMatch (client re-sort)
Auction Only       -> AUCTION           -> bestMatch
Buy It Now Only    -> FIXED_PRICE       -> bestMatch
Raw Cards          -> AUCTION           -> bestMatch (filter ungraded)
```

