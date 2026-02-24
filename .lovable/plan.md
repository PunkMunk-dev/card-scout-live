

# Test and Fix Card Finder Search Accuracy

## Issues Found

### 1. Card Finder Edge Function (`ebay-search`) -- Missing Category Filter
The Card Finder's `ebay-search` edge function searches **all of eBay** with no `category_ids` restriction. Both the TCG Lab (`tcg-ebay-search`) and Sports Lab (`sports-ebay-search`) correctly scope to category `183454` (Trading Cards) and `212` (Sports Cards) respectively, but Card Finder does not. This means a search like "Charizard VMAX" can return phone cases, plushies, t-shirts, etc.

### 2. Card Finder Edge Function -- No Junk Exclusion in Query
The TCG and Sports edge functions append exclusion terms directly in the eBay query string (e.g., `-lot`, `-bundle`, `-sealed`). Card Finder only filters junk *after* results come back, wasting API result slots on junk listings that get filtered out.

### 3. Card Finder Edge Function -- Title Match Too Loose
The `titleMatchesQuery` function uses a 70% threshold for "name-like terms." For a 3-word card name, this means matching only 2 of 3 words passes -- allowing unrelated cards through (e.g., searching "Charizard VMAX Rainbow" could return "Charizard V" cards).

### 4. Card Finder Edge Function -- `extractKeyTerms` strips important short terms
Terms like "V", "GX", "EX" (2 chars or less) are filtered out by `extractKeyTerms`, but these are critical for TCG card identification. "Charizard V" and "Charizard VMAX" are completely different cards.

### 5. Sports Lab and TCG Lab appear functional
Based on code review, the Sports Lab and TCG Lab search flows, filtering, and sorting logic are correctly wired. The recent `isLoading` fix should have resolved the StrictMode hang. No additional code changes needed for those.

---

## Plan

### File: `supabase/functions/ebay-search/index.ts`

**A. Add category filter for trading cards**
- Add `category_ids` parameter to the eBay Browse API call, scoping to category `183454` (Collectible Card Games) as a sensible default for a card finder tool.

**B. Add exclusion terms to the search query**
- Append common junk exclusions (lot, bundle, bulk, sealed, booster, box, etc.) as negative terms in the eBay query string, similar to how TCG Lab does it. This ensures eBay returns more relevant results in the first place, rather than wasting slots.

**C. Fix `extractKeyTerms` to keep short TCG-critical terms**
- Change the minimum term length filter from `> 1` to `> 0` or add a whitelist for critical short terms like "V", "GX", "EX", "SP", etc. so they are not dropped during title matching.

**D. Tighten `titleMatchesQuery` threshold**
- Increase the name-like term match threshold from 70% to 85% (effectively requiring all terms to match for queries with 3-6 key terms). This prevents partial matches from returning unrelated cards.

### No changes needed for:
- `supabase/functions/tcg-ebay-search/index.ts` -- already uses category `183454` and inline exclusions
- `supabase/functions/sports-ebay-search/index.ts` -- already uses category `212` and extensive filtering
- Sports Lab UI and TCG Lab UI -- search, sort, and filter pipelines are correctly wired

---

## Technical Summary

| Change | File | What |
|--------|------|------|
| Add category filter | `supabase/functions/ebay-search/index.ts` | Add `category_ids=183454` to Browse API URL params |
| Add query exclusions | `supabase/functions/ebay-search/index.ts` | Append `-lot -bundle -bulk -sealed -booster -box -pack -case -repack -mystery` to query |
| Keep short terms | `supabase/functions/ebay-search/index.ts` | Whitelist TCG terms (V, GX, EX, etc.) in `extractKeyTerms` |
| Tighten match ratio | `supabase/functions/ebay-search/index.ts` | Raise name match threshold from 0.7 to 0.85 |

