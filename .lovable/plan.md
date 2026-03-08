

## Plan: Fix eBay Rate Limit Exhaustion

### Root Cause

The `roi-auction-scanner` function processes cards in batches of 2 with only a 2-second delay. When it hits a 429, it logs the error but **continues scanning** — making dozens more failed requests that keep the rate limit active. The logs show 40+ consecutive 429 errors from this single function, blocking all other eBay-dependent features (Sports Lab, TCG Lab, ROI page).

### Fix: Add Circuit Breaker to roi-auction-scanner

Edit `supabase/functions/roi-auction-scanner/index.ts`:

1. **Detect 429 in `searchEbayAuctions`** — return a sentinel value (not just empty array) so the caller knows it was rate-limited vs. no results
2. **Circuit breaker in the batch loop** — after the first 429, stop processing immediately instead of continuing to fire doomed requests
3. **Increase `BATCH_DELAY_MS`** from 2000 to 4000ms to reduce pressure
4. **Reduce `BATCH_SIZE`** from 2 to 1 for sequential processing
5. **Return rate limit status** in the response so callers know the scan was interrupted

### Changes

**File: `supabase/functions/roi-auction-scanner/index.ts`**

- Line 8-9: Change `BATCH_SIZE = 1`, `BATCH_DELAY_MS = 4000`
- Lines 216-233: Make `searchEbayAuctions` throw a `RateLimitError` on 429 instead of silently returning `[]`
- Lines 294-342: Wrap batch loop with try/catch for `RateLimitError` — break immediately on first 429, include `rateLimited: true` in response

### What stays unchanged

- Sports Lab search flow, sold comps, ROI calculator
- All other edge functions
- Frontend code — the rate limit empty state already exists in the UI
- The scanner's card parsing, filtering, and upsert logic

