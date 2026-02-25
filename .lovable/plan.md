

# Add Query Simplification to TCG eBay Search Edge Function

## Problem
The decorative term stripping logic was only added to `ebay-search` (Sports Lab). The TCG Lab uses `tcg-ebay-search/index.ts`, which has no such logic. Searching "Charizard illustration rare" in the TCG Lab sends the full string to eBay, which may return poor or zero results.

## Solution
Port the same `simplifyQuery` logic into `supabase/functions/tcg-ebay-search/index.ts`.

## Changes: `supabase/functions/tcg-ebay-search/index.ts`

### 1. Add decorative terms list and simplify function (after line 57)

Add the same `DECORATIVE_TERMS` array and `simplifyQuery()` helper already in the sports edge function.

### 2. Apply simplification in `searchActiveListings` (line 84 area)

Before building the eBay query, strip decorative terms:

```text
Original flow:
  query -> fullQuery -> eBay API

New flow:
  query -> simplifyQuery() -> simplified query -> fullQuery -> eBay API
  decorativeFound terms saved for post-fetch boosting
```

### 3. Boost matching results after fetch (before return on ~line 170)

After items are mapped, sort listings that contain decorative terms higher -- same stable sort pattern used in `ebay-search`.

### 4. Redeploy the edge function

The function auto-deploys on save.

## No other files change
The client-side code (`tcgEbayService.ts`, `TerminalView.tsx`) passes queries through unchanged -- the fix is entirely server-side.

