

# Fix Card Finder Search for Long/Specific Queries

## Problem
The query "Charmander 2023 Scarlet & Violet: Black Star Promo #SVP044 Obsidian Flames Elite Trainer Box (Pokemon Center Stamp)" returns zero results because:

1. **Query too long for eBay**: The full query plus junk exclusions creates an enormous search string that eBay can't match
2. **Over-aggressive title matching**: `titleMatchesQuery` requires 60% of many extracted terms to match, which fails when the query has 15+ terms
3. **Junk filter false positive**: "Box" in "Elite Trainer Box" triggers the `isJunkTitle` filter on results that *do* come back

## Changes

### 1. `supabase/functions/ebay-search/index.ts` — Truncate long queries before sending to eBay

Add a query truncation step after `simplifyQuery` that caps the search query at ~10 words. This mirrors the `extractSearchQuery` pattern already used in the watchlist flow. The full original query is still used for title matching/boosting.

```
// Before sending to eBay, cap at 10 words to avoid overly specific queries
const searchWords = searchQuery.split(/\s+/).filter(w => w.length > 0);
const truncatedQuery = searchWords.slice(0, 10).join(' ');
```

Use `truncatedQuery` in the `searchEbay()` call instead of `searchQuery`.

### 2. `supabase/functions/ebay-search/index.ts` — Relax title matching for long queries

When the original query has many terms (e.g. >6), reduce the required match ratio from 60% to 40% so relevant results aren't discarded:

```
const nameMatchThreshold = nameLikeTerms.length > 6 ? 0.40 : 0.60;
const nameTermsMatch = nameMatchRatio >= nameMatchThreshold;
```

### 3. `supabase/functions/ebay-search/index.ts` — Exclude "Elite Trainer Box" from junk filter

"Elite Trainer Box" is a legitimate product name in the Pokémon TCG. Add a guard so "box" only triggers junk filtering when it isn't preceded by "trainer":

Update `isJunkTitle` to not match "box" when it appears as part of "trainer box" or "elite trainer box".

## Files Changed
- `supabase/functions/ebay-search/index.ts` (3 targeted edits, then redeploy)

