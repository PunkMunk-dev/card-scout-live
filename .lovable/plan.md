

# Plan: Add Additional Population Pattern Extraction

## Summary

Testing confirmed the gem rate formula is correct (`psa10 / total * 100 = %`). However, real eBay listings use patterns that aren't currently captured. A listing with `"PSA 10 Pop 4, Total Pop 6"` only extracted `psa10: 4` but missed `total: 6`.

## Current Issue

**Found in testing:**
| Listing Title | Extracted | Expected |
|---------------|-----------|----------|
| `Victor Wembanyama, PSA 10 Pop 4, Total Pop 6` | `psa10: 4, total: null` | `psa10: 4, total: 6, gemRate: 67` |

The pattern "Total Pop X" after the PSA 10 pop count is not being captured.

## Solution

Add additional two-value patterns to capture common seller formats:

### Pattern to Add
```text
/PSA\s*10\s+Pop[:\s]*(\d{1,5})[,\s]+Total\s+Pop[:\s]*(\d{1,6})/i
```

This matches: `PSA 10 Pop 4, Total Pop 6` and extracts both values.

---

## Technical Changes

### File: `supabase/functions/ebay-search/index.ts`

Add new pattern to the `twoValuePatterns` array (around line 52):

```typescript
const twoValuePatterns = [
  // NEW: "PSA 10 Pop 4, Total Pop 6" or "PSA 10 Pop: 4 Total Pop: 6"
  /PSA\s*10\s+Pop[:\s]*(\d{1,5})[,\s]+Total\s+Pop[:\s]*(\d{1,6})/i,
  // NEW: "Pop 4, Total 6" or "Pop 4 / Total 6"
  /\bPOP[:\s]*(\d{1,5})[,\s\/]+Total[:\s]*(\d{1,6})\b/i,
  // NEW: "Pop 4 out of 6" (variation of "of")
  /\bPOP[:\s]*(\d{1,5})\s+out\s+of\s+(\d{1,6})\b/i,
  
  // ...existing patterns...
];
```

---

## What This Enables

With the pattern added, the Wembanyama listing would extract:
- `psa10: 4`
- `total: 6`
- `gemRate: Math.round((4/6) * 100) = 67`

The badge would show **"Gem: 67%"** with the Database icon indicating real data from the listing.

---

## Verification

After deployment, searching for `"PSA 10 Pop total"` should return the Wembanyama listing with:
```json
{
  "popData": {
    "psa10": 4,
    "total": 6,
    "gemRate": 67,
    "source": "listing"
  }
}
```

