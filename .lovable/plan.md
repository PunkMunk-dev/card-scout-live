

## Plan: Update Top ROI Sorting (TopRoi.tsx only)

### Changes

**Single file: `src/pages/TopRoi.tsx`**

1. **Remove sport filter pills** — delete `SPORTS` array, `selectedSport` state, and the pills JSX block. Always pass `'All'` to `useRoiCards`.

2. **Replace sort options** with directional variants:

| Pill Label | Field | Direction |
|---|---|---|
| Profit ↑ | `psa10_profit` | desc (default) |
| Profit ↓ | `psa10_profit` | asc |
| Raw ↓ | `raw_avg` | asc (low→high) |
| Raw ↑ | `raw_avg` | desc (high→low) |
| Multiplier | `multiplier` | desc |

3. **Update sort logic** — the `filteredAndSorted` memo reads `dir` from the active option to sort ascending or descending.

4. **Remove `selectedSport` from the `useEffect` reset** dependency — only `searchQuery` and sort key remain.

No other files change. Existing search bar, skeleton, pagination, card component, and styling are untouched.

