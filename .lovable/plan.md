

# Fix Card Finder: Sparse Results Due to Post-Fetch Graded Filtering

## Problem Found
After testing, the graded card filter works logically but causes a severe usability issue: **only 1 card appears** in Best Match, Auction, and Buy It Now modes. This happens because:
- The edge function fetches up to 150 items from eBay
- For popular searches like "Luka Doncic Prizm," most eBay results are graded/slabbed cards
- Filtering them out post-fetch leaves almost no results (1 out of 150)

Additionally, the "Graded" mode shows some cards labeled "Ungraded," suggesting the `isGradedItem` detection has gaps.

## Solution
Move the graded exclusion **into the eBay search query itself** so eBay returns raw cards from the start, yielding full result pages.

## Technical Changes

### 1. `supabase/functions/ebay-search/index.ts`

**A. Add grading exclusion terms to the search query (around line 444-447)**

For all non-graded sort modes, append exclusion terms to the eBay query:
```
-PSA -BGS -CGC -SGC -graded -slab -slabbed
```

This tells eBay to exclude listings with those terms, so the API returns raw cards directly.

```text
// Before building the search query:
const gradedExclusions = ' -PSA -BGS -CGC -SGC -graded -slab -slabbed';
const searchQuery = sort === 'graded' 
  ? (simplified || query)
  : (simplified || query) + gradedExclusions;
```

**B. Keep the post-fetch `isGradedItem` filter as a safety net (line 489-492)**

Leave the existing post-fetch filter in place as a secondary cleanup, but the primary filtering now happens at the eBay API level, ensuring full result pages.

**C. For "Graded" mode, add graded terms to the query (around line 466-468)**

When sort is `'graded'`, append `+PSA +BGS +CGC +SGC` or similar to bias eBay toward graded results, improving the hit rate before the `isGradedItem` post-filter.

```text
const searchQuery = sort === 'graded'
  ? (simplified || query) + ' graded PSA BGS CGC SGC'
  : (simplified || query) + gradedExclusions;
```

### 2. No frontend changes needed
The dropdown and type definitions are already correct from the previous change.

## Expected Result
- **Best Match / Price / Auction / BIN**: Full grid of 48 raw/ungraded cards per page
- **Graded**: Full grid of graded/slabbed cards per page
- The `total` count from eBay will more accurately reflect the filtered result set

