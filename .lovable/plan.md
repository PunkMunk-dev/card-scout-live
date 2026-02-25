

# Preserve "RC" in cleanListingTitle

## Problem
The current regex on line 44 strips "RC" (Rookie Card abbreviation) from titles. "RC" is a meaningful identifier in card collecting that helps narrow search results to rookie cards specifically.

## Change

**File: `src/lib/cleanTitle.ts`, line 44**

Remove `RC` from the generic card terms regex so it's preserved in the cleaned output.

- **Before**: `cleaned = cleaned.replace(/\b(RC|rookie\s+card|card|cards)\b/gi, '');`
- **After**: `cleaned = cleaned.replace(/\b(rookie\s+card|card|cards)\b/gi, '');`

Also add the `#` to `/` conversion for card numbers (from the previously approved plan):

**Add after line 46** (after the generic card terms removal):
```typescript
// Convert card number hash to slash format (#256 -> /256) for broader eBay matching
cleaned = cleaned.replace(/#(\d+)/g, '/$1');
```

## Result

Input: `ANTHONY EDWARDS 2020 Prizm #256 Green Version Basketball RC!`
Output: `ANTHONY EDWARDS 2020 Prizm /256 Green Version RC`

Single file, two small edits.

