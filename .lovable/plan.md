

# Fix Remaining UI Inconsistencies

Three small tweaks to finish the unification pass.

## Changes

### 1. Remove `font-mono` from TCG shipping cost
**File:** `src/components/tcg-lab/TerminalCard.tsx` (line 112)
- Change `text-[10px] text-muted-foreground font-mono` to `text-xs text-muted-foreground`
- Matches the shipping style used in Card Finder's `ListingCard`

### 2. Standardize context bar text colors
Currently, `ContextBar` uses `text-foreground` for value spans (making them bold/bright), while `QuerySummaryBar` uses `text-muted-foreground` for everything. Align both to use `text-foreground` for the value portions (the actual names/counts), keeping the "Showing:" label as `text-muted-foreground`.

**File:** `src/components/tcg-lab/ContextBar.tsx` -- no change needed (already correct pattern)

**File:** `src/components/sports-lab/QuerySummaryBar.tsx` (line 27-28)
- Change value spans from `font-medium text-muted-foreground` to `text-foreground` to match ContextBar
- Change dot separator from `opacity-50` to `text-muted-foreground/50` to match ContextBar

**File:** `src/components/ResultsHeader.tsx` (line 23-24)
- Wrap count in a `text-foreground` span: `Showing: <span class="text-foreground">{total} listings</span>` to match the same pattern

### 3. Shrink Load More button in Card Finder status bar
**File:** `src/components/ResultsHeader.tsx` (lines 27-42)
- Add `size="sm"` and reduce to `h-6 text-[10px] px-2` so it fits within the `h-8` bar
- Shrink the loading spinner to `h-3 w-3`

## Summary

| File | Change |
|---|---|
| `src/components/tcg-lab/TerminalCard.tsx` | Remove `font-mono` from shipping span |
| `src/components/sports-lab/QuerySummaryBar.tsx` | Use `text-foreground` for value text, match dot separator style |
| `src/components/ResultsHeader.tsx` | Add "Showing:" label pattern, shrink Load More button to fit thin bar |
