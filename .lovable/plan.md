

## Plan: Fix `sports-ebay-search` Input Parsing and CORS

### Problem
1. The function only accepts `playerName` — diagnostics sends `{ query: "test", limit: 1 }` which fails with 500 "playerName is required"
2. The error response uses status 500 instead of 400 for missing input
3. CORS headers are missing `Access-Control-Allow-Methods`, and the OPTIONS handler returns `null` body instead of `"ok"`

### Changes to `supabase/functions/sports-ebay-search/index.ts`

**1. Update CORS headers** (line 3-6): Add `Access-Control-Allow-Methods: POST, OPTIONS`

**2. Fix OPTIONS handler** (line 380): Return `"ok"` body instead of `null`

**3. Replace request parsing** (lines 386-387): 
- Use `await req.json().catch(() => ({}))` for safe parsing
- Accept `playerName || query || player || name` as the player name
- Return 400 (not 500) with proper error JSON if none provided

**4. Use resolved `playerName` variable** (line 389): Pass it into `searchParams` instead of destructured `body.playerName`

No changes to filtering, caching, eBay API calls, or any other file.

