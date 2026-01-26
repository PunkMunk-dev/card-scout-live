
# Fix Price: Low-High Sort to Show All Listings

## Problem

When sorting by "Price: Low-High", only 1 card is displayed instead of all available listings.

**Root Cause**: The eBay API returns completely different (and fewer) results when using `sort=price` vs `sort=bestMatch`. For specific card queries, the price-sorted results from eBay contain mostly unrelated items that get filtered out by the query matching logic.

## Solution

For `price_asc` sort, fetch results using `bestMatch` first (to get all relevant cards), then sort them by price client-side.

## Change

**File:** `supabase/functions/ebay-search/index.ts`

**Line 200-208:** Update `getSortParam` function to use `bestMatch` for `price_asc`:

```typescript
function getSortParam(sort: string): string {
  switch (sort) {
    case 'price_asc':
      return 'bestMatch';  // Changed from 'price' - client will sort
    case 'end_soonest':
      return 'endingSoonest';
    case 'raw':
      return 'bestMatch';
    case 'graded':
      return 'bestMatch';
    case 'best':
    default:
      return 'bestMatch';
  }
}
```

The existing client-side price sorting at lines 447-452 will then correctly order ALL relevant cards by price.

## Expected Result

- Price: Low-High will show all 24+ cards (same as Best Match)
- Cards will be correctly ordered from lowest to highest price
- All relevant variations of the card will appear
