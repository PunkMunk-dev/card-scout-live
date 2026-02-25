

# Fix Card Finder Not Pulling Enough Listings

## Root Cause

The `ebay-search` edge function has two compounding problems:

1. **Over-fetch cap too low**: It tries to compensate for filtering by requesting `limit * 3`, but caps at 50. After aggressive client-side filtering (title match, junk, graded/raw, buying options), this often yields only 10-15 usable results per page instead of the requested 24.

2. **Pagination skips items**: The offset calculation uses `requestLimit` (50), not `clampedLimit` (24). So page 2 starts at offset 50, meaning items 15-49 that survived filtering on page 1 but were sliced away are permanently lost.

## Changes

### File: `supabase/functions/ebay-search/index.ts`

**Line 390**: Increase the limit cap from 50 to 100 so more items survive filtering:
```
// Before
const requestLimit = Math.min(clampedLimit * 3, 50);

// After
const requestLimit = Math.min(clampedLimit * 4, 100);
```

**Line 397**: Fix pagination offset to use `requestLimit` consistently (this part is actually correct since eBay needs offset = page * requestLimit). The real fix is increasing requestLimit above so more results survive filtering per page.

**Line 390 (clampedLimit)**: Also raise the hard clamp from 50 to 100 to allow larger page sizes:
```
// Before
const clampedLimit = Math.min(Math.max(limit, 1), 50);

// After  
const clampedLimit = Math.min(Math.max(limit, 1), 50);  // keep at 50 for output
```

### File: `src/pages/Index.tsx`

**Line 127**: Increase the per-page request from 24 to 48 so the edge function has more budget to work with after filtering:
```
// Before
limit: 24,

// After
limit: 48,
```

## Summary of Changes

| File | Change | Why |
|------|--------|-----|
| `supabase/functions/ebay-search/index.ts` line 390 | `clampedLimit * 3, 50` to `clampedLimit * 3, 150` | Let eBay return more raw items before filtering |
| `supabase/functions/ebay-search/index.ts` line 393 | Raise requestLimit cap | More items survive the filter pipeline |
| `src/pages/Index.tsx` line 127 | `limit: 24` to `limit: 48` | Request more items per page from edge function |

No UI, routing, or design changes. Only the fetch volume and filter pipeline are adjusted.

