

## Fix: Add Retry Logic and Token Caching to `ebay-search` Edge Function

### Problem
The `ebay-search` function is returning 500 errors because eBay's API responds with 429 (rate limited). Unlike `tcg-ebay-search` which has `fetchWithRetry` with exponential backoff, `ebay-search` has no retry logic and also requests a fresh OAuth token on every single invocation (compounding rate limit pressure).

### Changes

**File:** `supabase/functions/ebay-search/index.ts`

1. **Add `fetchWithRetry` helper** (same pattern as `tcg-ebay-search`): exponential backoff with jitter on 429, up to 3 retries. Apply it to the `searchEbay` fetch call (line 321).

2. **Add in-memory OAuth token cache**: Cache the eBay access token for ~4 minutes (tokens are valid for ~7200s) to avoid hitting the OAuth endpoint on every request. Same pattern as `tcg-ebay-search`'s `TokenCache`.

3. **Apply `fetchWithRetry` to the OAuth token fetch** as well (line 272), since that endpoint can also be rate-limited.

These are the same patterns already proven in `tcg-ebay-search`. No frontend changes needed.

