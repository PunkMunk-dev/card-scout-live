
# Fix: Auction Only and Raw Cards Sort Options Returning No Results

## Problem

Testing revealed that **"Auction Only"** and **"Raw Cards"** sort options return zero results. Two bugs are causing this:

### Bug 1: Edge function filtering logic
In `supabase/functions/ebay-search/index.ts` (lines 442-444), the `else` block catches `auction_only` and `buy_now_only` and filters to only non-graded cards. This is wrong for `auction_only` and `buy_now_only` -- they should show ALL cards (both graded and raw), filtered only by buying format.

### Bug 2: Over-restrictive buying format for "Raw Cards"
In `src/pages/Index.tsx`, the `deriveBuyingOptions` function maps `raw` to `AUCTION`. This means Raw Cards only shows auction listings. Combined with the non-graded filter, the result set is too narrow. Raw Cards should show ALL buying formats (both auction and buy-it-now) but exclude graded cards.

## Changes

### 1. Fix edge function filtering (`supabase/functions/ebay-search/index.ts`)

Update the graded/raw filtering section to add explicit cases for `auction_only` and `buy_now_only`:

```
if (sort === 'graded') {
  // ... existing graded logic unchanged ...
} else if (sort === 'raw') {
  // Show only ungraded/raw cards
  normalizedItems = normalizedItems.filter(item => !isGradedItem(item.title));
} else if (sort === 'auction_only' || sort === 'buy_now_only' || sort === 'price_asc') {
  // Show ALL cards (both graded and raw) - filtering is done by buyingOptions only
} else {
  // Default (best, end_soonest): show only raw/ungraded cards
  normalizedItems = normalizedItems.filter(item => !isGradedItem(item.title));
}
```

### 2. Fix buying format derivation (`src/pages/Index.tsx`)

Change `deriveBuyingOptions` so that `raw` uses `ALL` instead of `AUCTION`:

```
function deriveBuyingOptions(sort: SortOption): 'ALL' | 'AUCTION' | 'FIXED_PRICE' {
  if (sort === 'auction_only') return 'AUCTION';
  if (sort === 'buy_now_only') return 'FIXED_PRICE';
  return 'ALL';
}
```

### 3. Deploy the edge function

Re-deploy `ebay-search` after the fix.

## Expected Results After Fix

| Sort Option | Buying Format Filter | Graded/Raw Filter | Expected Behavior |
|---|---|---|---|
| Best Match | ALL | Raw only | Default view, ungraded cards |
| Price: Low-High | ALL | None | All cards sorted by price |
| Auction Only | AUCTION | None | All auction listings (graded + raw) |
| Buy It Now Only | FIXED_PRICE | None | All Buy It Now listings (graded + raw) |
| Raw Cards | ALL | Raw only | Ungraded cards, all buying formats |
