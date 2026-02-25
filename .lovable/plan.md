

# Preserve Identifying Details in cleanListingTitle

## Problem
Two regex rules are removing meaningful card identifiers:
- `version` / `ver` (line 44) -- these describe variants like "Green Version", "Holo Ver"
- `#123` card numbers (line 47) -- these identify specific cards in a set like "#45"

## Changes (single file: `src/lib/cleanTitle.ts`)

1. **Line 44**: Remove `version` and `ver` from the generic card terms regex, keeping only truly generic words:
   - Before: `\b(RC|rookie\s+card|card|cards|version|ver)\b`
   - After: `\b(RC|rookie\s+card|card|cards)\b`

2. **Line 47**: Delete the `#\d+` removal rule entirely so card numbers like `#45`, `#123` are preserved in the search query.

No other files change. Variant/parallel terms like "Prizm", "Chrome", "Parallel", "Holo", "Refractor" are already preserved.
