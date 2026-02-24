

# Fix "Ungraded" Filter Showing Graded Cards

## Problem

When selecting "Ungraded" in Card Finder, graded cards still appear in results. This happens because:

1. The `isGradedItem()` function only checks titles for a limited set of keywords (`psa`, `bgs`, `sgc`, `cgc`, `beckett`, `graded`), missing companies like CCIC, ACE, MNT, etc.
2. eBay already returns a `condition` field that says "Graded" or "Ungraded" -- we display it but never use it for filtering.

## Plan

### File: `supabase/functions/ebay-search/index.ts`

**A. Update `isGradedItem` to also check the eBay condition field**
- Change the function signature to accept both `title` and `condition` parameters
- Return `true` if the condition field contains "graded" (case-insensitive) OR if title contains any graded keyword
- Add additional grading company keywords: `ccic`, `ace`, `mnt`, `tag`, `cga`, `ags`, `hga`

**B. Update all call sites of `isGradedItem`**
- Pass `item.condition` alongside `item.title` at every call site (lines ~411, 421, 433, 444)
- The `normalizeItem` function already maps eBay's condition to `item.condition`, so this data is available

### Technical Details

```
// Updated function signature
function isGradedItem(title: string, condition?: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerCondition = (condition || '').toLowerCase();
  if (lowerCondition.includes('graded')) return true;
  return GRADED_KEYWORDS.some(keyword => lowerTitle.includes(keyword));
}

// Updated GRADED_KEYWORDS
const GRADED_KEYWORDS = ['psa', 'bgs', 'sgc', 'cgc', 'beckett', 'graded', 'ccic', 'ace', 'mnt', 'tag', 'cga', 'ags', 'hga'];
```

Lines affected: ~152-157 (keywords + function), ~421, ~433, ~444 (call sites where condition is passed).

