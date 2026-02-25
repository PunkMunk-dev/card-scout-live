

# Fix: Missing Return Statement in `tcg-ebay-search`

## Problem Found
The edge function returns an **empty response body** for all queries. The last edit accidentally deleted the `return` statement from `searchActiveListings`. Line 206 computes `hasMore` but the function ends without returning anything.

Looking at the diff, the original line:
```
return { items, total, offset, hasMore };
```
was removed when the boosting logic was added.

## Fix

**File:** `supabase/functions/tcg-ebay-search/index.ts`

**Line 206** -- add the missing return statement:

```ts
  const hasMore = (offset + items.length) < total;
  return { items, total, offset, hasMore };
}
```

This is a one-line fix. The function will then correctly return results, with decorative-term matches boosted to the top.

