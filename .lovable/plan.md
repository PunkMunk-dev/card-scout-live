

## Plan: Add Sport Filter Dropdown to Live Auctions Toolbar

### Approach
Derive available sports from the feed data itself (each `card` has a `sport` field), so no extra DB query is needed. Add a `Select` dropdown to the toolbar that filters the displayed feed client-side.

### Changes

#### 1. `src/pages/TopRoi.tsx`
- Add `sport` state (`string`, default `"All"`)
- Import `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` from `@/components/ui/select`
- Derive unique sports from `feed` via `useMemo` (e.g. `[...new Set(feed.map(f => f.card.sport))].sort()`)
- Filter `feed` by selected sport before rendering (client-side, so the 30s refetch still works for all sports)
- Add the Select dropdown in the toolbar between the min-profit input and the spacer
- Include snapshot state for the sport filter
- Style: compact (`h-7 w-[130px] text-xs`) matching the existing toolbar aesthetic

No hook or component changes needed — purely a page-level UI addition with client-side filtering.

