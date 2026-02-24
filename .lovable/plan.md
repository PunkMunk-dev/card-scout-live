

# Fix Card Finder Search Accuracy

## Bugs Found

### Bug 1: Sports card searches return zero results
The Card Finder hardcodes `category_ids=183454` (Collectible Card Games). This excludes sports cards entirely -- category `212` covers sports trading cards. A search like "Caleb Williams Prizm" returns `total: 0` from eBay because it's looking in the wrong category.

### Bug 2: Graded card searches return empty results
When sort is "best" (default), the edge function filters out ALL graded cards (line 449-450). This means searching "PSA 10 Charizard VMAX" returns 0 items despite eBay having 1,025 matches. Users explicitly searching for graded cards get nothing.

### Bug 3: Stale comment
Line 197 comment says "70%" but threshold is already 0.85.

---

## Plan

### File: `supabase/functions/ebay-search/index.ts`

**A. Remove hardcoded category filter** (line 260)
- Remove `category_ids: '183454'` from the search params. Card Finder is a general-purpose search tool that should work for both TCG and sports cards. The junk exclusion terms and title matching already filter out irrelevant results. The TCG Lab and Sports Lab have their own dedicated edge functions with proper category scoping.

**B. Stop filtering graded cards on default sort** (lines 448-451)
- Remove the `else` clause that filters out graded cards on "best" sort. The default view should show ALL cards (graded + raw). Users can select "Ungraded" filter to see only raw cards. This fixes the case where "PSA 10 Charizard VMAX" returns zero results.

**C. Fix stale comment** (line 197)
- Update comment from "70%" to "85%" to match the actual threshold.

---

## Technical Summary

| Change | Lines | What |
|--------|-------|------|
| Remove category_ids | 260 | Delete `category_ids: '183454'` from URLSearchParams |
| Show all cards on default sort | 448-451 | Remove the `else` block that filters graded cards on "best" sort |
| Fix comment | 197 | Update "70%" to "85%" |

