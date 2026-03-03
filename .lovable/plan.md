

## Plan: Fix Empty eBay Listings with Progressive Query Fallback

### Root Cause
The `roi-ebay-listings` edge function builds two queries:
- **Strict**: `nameCore + setCore + cardNumber` (e.g. "Victor Wembanyama 2024 Revolution Kaboom! 15")
- **Fallback**: `nameCore + setCore` (e.g. "Victor Wembanyama 2024 Revolution Kaboom!")

Both are too specific for many cards. eBay sellers often list as just "Victor Wembanyama 2024 Revolution" without the insert name or card number, so both queries return 0 results.

### Fix (single file: `supabase/functions/roi-ebay-listings/index.ts`)

Add a **third fallback query** that uses only `nameCore` (player/card name + year + brand, without the variant/insert name):

```
Query cascade:
1. Strict:   "Victor Wembanyama 2024 Revolution Kaboom! 15"
2. Fallback: "Victor Wembanyama 2024 Revolution Kaboom!"
3. Broad:    "Victor Wembanyama 2024 Revolution"
```

**Changes to `buildEbayQueries`:**
- Return a third query: `broadQueryText` = `nameCore` only (player + year + product line, stripping variant/insert keywords like "Kaboom!", "Downtown", "All Kings")
- Improve `parseCardName` to separate insert/variant names (e.g. "Kaboom!", "Downtown", "Helix", "All Kings") from the base set name so the broad query is cleaner

**Changes to the main handler:**
- After strict + fallback, if results are still < `MIN_STRICT_RESULTS`, run the broad query
- Same dedup + rank logic applies

**Changes to `parseCardName`:**
- Add a list of known insert keywords (`Kaboom`, `Downtown`, `Helix`, `All Kings`, `Rookie Autographs`, `Negative Refractor`, etc.) that get stripped into the `variant` field instead of staying in `setCore`
- This ensures the broad fallback is just "Player Year Brand" which almost always has eBay results

### Also fix: empty cache poisoning
Currently, empty results get cached for 20 minutes. Add a shorter TTL (2 minutes) for empty results so retries happen sooner.

### No frontend changes needed
The `RoiCard` component already handles the image/no-image states correctly. Once the edge function returns results, images will appear.

