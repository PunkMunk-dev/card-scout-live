

# Fix: Remove Query-Level Graded Exclusions (They Break eBay Results)

## Problem
The `-PSA -BGS -CGC -SGC` exclusions added to the eBay search query combine with the existing 12 junk exclusions (`-lot -bundle -bulk -sealed ...`) on line 297, producing 16 total negative keywords. The eBay Browse API cannot handle this many exclusions and returns only 1 item for queries like "Luka Doncic Prizm" despite reporting `total: 20032`.

## Solution
Remove the query-level graded exclusions entirely. The post-fetch `isGradedItem` filter on line 495-497 already handles this correctly. The edge function fetches up to 150 items (`requestLimit = clampedLimit * 3`), filters out graded ones, then returns up to 48. This approach works because:
- The over-fetch ratio (3x) provides enough headroom
- The `isGradedItem` function catches PSA, BGS, CGC, SGC, and other grading keywords reliably

## Technical Change

### `supabase/functions/ebay-search/index.ts` (lines 447-451)

Remove the `gradedExclusions` variable and simplify back to just using `baseQuery`. Keep the graded-mode query enhancement for the "Graded" dropdown option.

**Before:**
```typescript
const gradedExclusions = ' -PSA -BGS -CGC -SGC';
const searchQuery = sort === 'graded'
  ? baseQuery + ' graded PSA BGS CGC SGC'
  : baseQuery + gradedExclusions;
```

**After:**
```typescript
const searchQuery = sort === 'graded'
  ? baseQuery + ' graded PSA BGS CGC SGC'
  : baseQuery;
```

No other changes needed. The post-fetch filters on lines 472-498 handle graded vs raw filtering after results come back from eBay.

