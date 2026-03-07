

## Plan: Improve eBay Rate Limit Resilience Across All Edge Functions

### Problem
All three search edge functions (`ebay-search`, `tcg-ebay-search`, `sports-ebay-search`) crash with 500 errors when eBay rate limits (429) exhaust retries. The frontend then shows generic "No results found" instead of informing the user about the rate limit. This is the only issue preventing the API from pulling properly — the code is correct, it just lacks graceful degradation.

### Changes

**1. `ebay-search` — Graceful fallback on 429 exhaustion**
- Instead of `throw new Error('fetchWithRetry: exhausted retries')`, catch 429 specifically and return an empty result set with `{ items: [], total: 0, nextPage: null, rateLimited: true }`.
- This prevents the 500 and lets the frontend handle it gracefully.

**2. `tcg-ebay-search` — Same graceful fallback**
- In `searchActiveListings`, when `fetchWithRetry` throws on 429 exhaustion, catch and return `{ items: [], total: 0, hasMore: false, rateLimited: true }` instead of re-throwing a 500.

**3. `sports-ebay-search` — Already partially handles this (returns 429 status with Retry-After header), but verify consistency**
- Ensure it also returns a structured JSON response body with `{ success: false, rateLimited: true }` instead of just a status code.

**4. Frontend rate-limit awareness**
- `src/pages/Index.tsx`: Detect `rateLimited: true` in the response and show a toast with "eBay rate limited. Please wait a moment and try again." instead of the generic "No results found".
- `src/services/tcgEbayService.ts`: Detect `rateLimited` flag and surface it to the UI layer so TCG Lab can show appropriate messaging.
- `src/hooks/useSportsEbaySearch.ts`: Already handles 429 status via error message — no changes needed.

**5. Shared rate-limit empty state**
- Add a `rateLimited` variant to `UnifiedEmptyState` or show an inline banner when rate-limited, with a "Retry" button and a note about waiting 30-60 seconds.

### Files to edit
- `supabase/functions/ebay-search/index.ts` (graceful 429 fallback)
- `supabase/functions/tcg-ebay-search/index.ts` (graceful 429 fallback)
- `src/pages/Index.tsx` (rate-limit toast/UX)
- `src/services/tcgEbayService.ts` (pass through rateLimited flag)
- `src/components/shared/UnifiedEmptyState.tsx` (rate-limit variant)

