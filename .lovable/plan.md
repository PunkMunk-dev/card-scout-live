

# Fix Card Finder: Empty Results with Graded Exclusions

## Problem Discovered
Testing revealed that the graded exclusion terms added to the eBay query (`-PSA -BGS -CGC -SGC -graded -slab -slabbed`) cause **zero results** for specific card searches like "Luka Doncic Prizm". This happens because:

1. The eBay Browse API already has junk exclusions (`-lot -bundle -bulk` etc.) appended on line 297
2. Adding 7 more graded exclusions makes the query too restrictive -- eBay returns `itemSummaries: []` despite showing `total: 19968`
3. Simpler queries like "Luka Doncic" (without "Prizm") work fine, confirming it's a query-length/complexity issue

Meanwhile, the "Graded" mode works correctly and returns slabbed cards.

## Solution
Reduce the eBay query-level exclusions to just the most impactful terms (`-PSA -BGS -CGC -SGC`) and drop the redundant ones (`-graded -slab -slabbed`). The post-fetch `isGradedItem` filter already catches those edge cases as a safety net.

## Technical Changes

### `supabase/functions/ebay-search/index.ts` (line 448)

Change the exclusion string from:
```
' -PSA -BGS -CGC -SGC -graded -slab -slabbed'
```
To:
```
' -PSA -BGS -CGC -SGC'
```

This reduces total exclusions from ~19 terms to ~16, staying within eBay's effective query complexity limit while still excluding the vast majority of graded listings at the API level. The existing `isGradedItem` post-filter on line 497 handles any stragglers.

### No other changes needed
- The "Graded" mode query (`+ graded PSA BGS CGC SGC`) already works
- The post-fetch `isGradedItem` filter remains as a safety net
- Frontend code is unchanged

## Expected Result
- "Luka Doncic Prizm" in Best Match returns a full grid of raw cards
- "Graded" mode continues to return slabbed cards
- Auction and Buy It Now modes work with full results

