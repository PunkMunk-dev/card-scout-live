

## Plan: Replace /roi with Live Auctions-only page

The backend infrastructure (table `roi_live_auctions`, edge function `roi-auction-scanner`, cron schedule) already exists and is working. This is primarily a UI cleanup task.

### Changes

**1. Navigation labels** — 3 files

| File | Change |
|------|--------|
| `src/components/layout/AppSidebar.tsx` | Change `{ to: '/roi', label: 'ROI', icon: TrendingUp }` to `label: 'Live Auctions'` |
| `src/components/layout/MobileTabBar.tsx` | Change `{ to: '/roi', label: 'ROI', icon: TrendingUp }` to `label: 'Live'` |
| `src/components/layout/AppShell.tsx` | Change `ROUTE_PILLS['/roi']` from `'ROI'` to `'Live'` |

**2. Rewrite `src/pages/TopRoi.tsx`** — Remove tabs, old ROI grid, sort pills, search box, `usePrefetchRoiEbayListings`, `SORT_OPTIONS`, `SkeletonGrid`, pagination state. The page becomes:

- `useRoiCards('All')` for card metadata (kept for join)
- `useLiveRoiAuctions()` for live data (already exists)
- `PageHeader` with title "Live Auctions", subtitle "Auto-detecting live eBay auctions for your ROI list", snapshot in `rightSlot`
- Inline the filter toolbar + grid from `LiveRoiAuctions` component directly (min profit, ending soon toggle, enriched grid)
- Updated snapshot state reflecting `{ minProfit, endingSoon }` filters and live row count
- Remove imports: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Search`, `X`, `RoiCard`, `Skeleton`, `getSession`/`setSession` for sort/tab keys

**3. No backend changes needed** — Table, indexes, unique constraint, RLS, edge function, and cron are all already in place.

### Files modified

| File | Action |
|------|--------|
| `src/pages/TopRoi.tsx` | Rewrite to live-auctions-only |
| `src/components/layout/AppSidebar.tsx` | Label change (line 22) |
| `src/components/layout/MobileTabBar.tsx` | Label change (line 9) |
| `src/components/layout/AppShell.tsx` | Pill label change (line 20) |

