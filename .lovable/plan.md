

# Improve Junk Filtering for Misspelled Terms

## Problem

The current `isJunkTitle` function uses exact word-boundary regex matching against a keyword list. Sellers sometimes misspell or split words in titles (e.g., "Lof ot Two" instead of "Lot of Two"), which bypasses the filter entirely.

## Approach

Add a **fuzzy junk detection layer** to `isJunkTitle` in `supabase/functions/ebay-search/index.ts` that catches common misspellings and split-word patterns, while keeping the existing exact-match logic as the primary filter.

### File: `supabase/functions/ebay-search/index.ts`

**A. Add fuzzy/pattern-based junk detection** (~lines 161-167)

After the existing exact keyword check, add a second pass that catches:

1. **Multi-word lot patterns** -- regex patterns for phrases like "lot of", "set of", "X cards", "X card lot" regardless of minor misspellings:
   - `/\b\d+\s*(cards?|card\s*lot)\b/i` -- "10 cards", "5 card lot"
   - `/\blot\s+of\b/i` -- already caught, but add split-word variant
   - `/\bl\s*o\s*t\b/i` -- catches "l o t", "l ot", "lo t" (spaced-out "lot")
   - `/\b\d+x\b/i` -- "2x", "4x" (quantity indicators)
   - `/\bx\s*\d+\b/i` -- "x2", "x 3"

2. **Quantity indicators** that strongly signal bulk/lot listings:
   - `/\(\s*\d+\s*\)/` -- "(10)", "(25)" -- quantities in parentheses
   - `/\b\d{2,}\s*card\b/i` -- "50 card", "100 card"

3. **Common misspelling patterns**:
   - `/\bselaed\b|\bseled\b|\bseal\b/i` -- misspellings of "sealed"
   - `/\bbulck\b|\bbluk\b/i` -- misspellings of "bulk"

**B. Add new exact keywords** to `JUNK_KEYWORDS` array (~line 129-134):
- `'grab bag'`, `'pick your'`, `'you pick'`, `'choose your'`, `'u pick'`, `'your choice'`

### Technical Details

The updated `isJunkTitle` function will look like:

```text
function isJunkTitle(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  
  // Pass 1: exact keyword matching (existing)
  const exactMatch = JUNK_KEYWORDS.some(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(lowerTitle);
  });
  if (exactMatch) return true;
  
  // Pass 2: fuzzy/pattern-based detection
  const junkPatterns = [
    /\bl\s*o\s*t\b/i,              // spaced-out "lot"
    /\b\d+\s*cards?\b/i,           // "10 cards", "5 card"
    /\b\d+\s*card\s*lot\b/i,       // "10 card lot"
    /\b\d+x\b|\bx\s*\d+\b/i,      // "2x", "x3"
    /\(\s*\d+\s*\)/,               // "(10)" quantity in parens
    /\bselaed\b|\bseled\b/i,       // misspelled "sealed"
    /\bbulck\b|\bbluk\b/i,         // misspelled "bulk"
  ];
  
  return junkPatterns.some(p => p.test(lowerTitle));
}
```

**Risk note**: The `/\bl\s*o\s*t\b/i` pattern could theoretically match odd substrings, but `\b` word boundaries keep it safe. The `\d+\s*cards?` pattern is very safe since single-card listings never say "1 cards" in the title.

### Summary

| Change | What |
|--------|------|
| Expand `JUNK_KEYWORDS` | Add pick/choose terms |
| Add fuzzy patterns to `isJunkTitle` | Catch misspellings and split words |
| Keep existing logic | Exact keyword matching remains the primary filter |

