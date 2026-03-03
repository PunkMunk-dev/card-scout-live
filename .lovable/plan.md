

# Fix Long TCG Query Search in Card Finder

## Problem
The query "Charmander 2023 Scarlet & Violet: Black Star Promo #SVP044 Obsidian Flames Elite Trainer Box (Pokemon Center Stamp)" still returns 0 results because:

1. **Truncation keeps noise**: The first 10 words include `Violet:`, `#SVP044`, and `Obsidian Flames` which over-constrain the eBay search
2. **No pre-cleaning**: Card numbers (`#SVP044`), parenthetical info (`(Pokemon Center Stamp)`), colons, and set identifiers are kept as-is before truncation

The eBay API query ends up as: `Charmander 2023 Scarlet & Violet: Black Star #SVP044 Obsidian Flames` -- too specific to match anything.

## Solution

Add a query pre-cleaning step in `supabase/functions/ebay-search/index.ts` **before** the 10-word truncation that:

1. Strips parenthetical content: `(Pokemon Center Stamp)` -> removed
2. Strips card number patterns: `#SVP044`, `#123`, `#SWSH183` -> removed  
3. Strips colons -> removed
4. Then truncate to 10 words

This transforms the query to something like: `Charmander 2023 Scarlet Violet Black Star Promo Obsidian Flames Elite` which is much more likely to return results from eBay, while the existing `titleMatchesQuery` still filters for relevance.

### Changes

**`supabase/functions/ebay-search/index.ts`** (lines 453-455):

Add a cleaning function before truncation:
```typescript
// Clean query for eBay: strip parentheticals, card numbers, colons
const cleanedForEbay = searchQuery
  .replace(/\([^)]*\)/g, '')     // Remove (parenthetical content)
  .replace(/#[A-Za-z0-9]+/g, '') // Remove card numbers like #SVP044
  .replace(/:/g, '')             // Remove colons
  .replace(/\s{2,}/g, ' ')
  .trim();

// Cap at 10 words
const searchWords = (cleanedForEbay || searchQuery).split(/\s+/).filter(w => w.length > 0);
const truncatedQuery = searchWords.slice(0, 10).join(' ');
```

This would produce: `Charmander 2023 Scarlet Violet Black Star Promo Obsidian Flames Elite` -- a clean 10-word query that should return Charmander promo results.

### Also needs the same fix in `tcg-ebay-search`

The TCG Lab search (`supabase/functions/tcg-ebay-search/index.ts`) also returned 0 results for this query. The same pre-cleaning and truncation logic should be applied there in the `searchActiveListings` function before sending the query to eBay.

### Files changed
- `supabase/functions/ebay-search/index.ts` -- add query pre-cleaning before truncation
- `supabase/functions/tcg-ebay-search/index.ts` -- add same query pre-cleaning and 10-word truncation
- Redeploy both edge functions

