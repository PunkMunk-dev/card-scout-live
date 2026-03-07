

## Plan: Fix Rate-Limit Flag Propagation in Edge Functions

### Problem
When eBay returns 429 (rate limited), the inner `searchEbay()` function in `ebay-search/index.ts` returns `{ items: [], total: 0 }` **without** a `rateLimited` flag. The outer handler builds a normal empty response, so the frontend never shows the rate-limit UI — it just shows "0 listings" with infinite loading skeletons.

Same issue exists in `tcg-ebay-search/index.ts` where the inner `searchActiveListings()` throws on non-OK responses (including 429 from the synthetic `fetchWithRetry` fallback), which **does** hit the catch block, but only if the error message contains "429".

### Root Cause
- `ebay-search`: `searchEbay()` line 393-394 returns `{ items: [], total: 0 }` on 429 — no `rateLimited` flag. The main handler at line 628 builds a normal response.
- `ebay-search`: catch block line 650 references `body` which is scoped inside the try block — will cause a ReferenceError.
- `tcg-ebay-search`: `searchActiveListings()` line 205-208 throws on any non-OK response. The synthetic 429 from `fetchWithRetry` triggers this throw, which hits the catch block correctly. This path works but is fragile.

### Changes

**1. `supabase/functions/ebay-search/index.ts`**
- Inner `searchEbay()`: return `{ items: [], total: 0, rateLimited: true }` on 429 (add flag).
- Main handler (~line 554): after calling `searchEbay()`, check if result has `rateLimited: true` and short-circuit to return the rate-limited response immediately.
- Fix catch block: replace `body?.query` with `'unknown'` or capture query in outer scope before try.

**2. `supabase/functions/tcg-ebay-search/index.ts`**
- Inner `searchActiveListings()`: catch 429 specifically and return `{ items: [], total: 0, hasMore: false, rateLimited: true }` instead of throwing.
- Main handler: check for `rateLimited` in result and return it in the response.

### Files to edit
- `supabase/functions/ebay-search/index.ts`
- `supabase/functions/tcg-ebay-search/index.ts`

