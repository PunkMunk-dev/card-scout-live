

## Plan: Remove Dead Code

After the ROI refactor to Live Auctions-only, several files and exports are no longer imported anywhere and should be deleted.

### Dead files to delete

| File | Reason |
|------|--------|
| `src/components/roi/RoiCard.tsx` | Only used by old Top ROI grid (removed). No imports remain. |
| `src/components/roi/LiveRoiAuctions.tsx` | Was the tabbed sub-component. Logic now inlined in `TopRoi.tsx`. No imports remain. |
| `src/hooks/useRecommendations.ts` | Zero imports across the entire codebase. |
| `src/lib/api/firecrawl.ts` | Zero imports across the entire codebase. |

### Dead exports to remove from `src/hooks/useRoiCards.ts`

| Export | Reason |
|--------|--------|
| `useRoiEbayListings` | Only consumer was deleted `RoiCard.tsx`. |
| `usePrefetchRoiEbayListings` | Only consumer was old Top ROI page. |
| `RoiEbayListing` interface | Only used by the two dead functions above. |
| `useQueryClient` import | Only needed by `usePrefetchRoiEbayListings`. |
| `useEffect` import | Only needed by `usePrefetchRoiEbayListings`. |

After cleanup, `useRoiCards.ts` retains only `RoiCard` interface and `useRoiCards()` hook.

### Stale audit data reference in `src/lib/uiAuditData.ts`

The hardcoded code snippet mentioning `usePrefetchRoiEbayListings` and old sort/tab state is now inaccurate. Update the ROI section's code excerpt to reflect the current Live Auctions architecture (filters: minProfit/endingSoon, hooks: useRoiCards + useLiveRoiAuctions).

### Edge functions to consider

`roi-ebay-listings/index.ts` and `roi-ebay-listings-batch/index.ts` served the old per-card eBay lookup used by `RoiCard.tsx` and `usePrefetchRoiEbayListings`. They are no longer called from frontend code. However, edge functions may be invoked externally or by cron, so flag for deletion but verify first. `roi-seed/index.ts` is a one-time data loader — safe to keep.

### Summary

- Delete 4 dead files
- Trim `useRoiCards.ts` to essential exports only
- Update stale audit data string
- No logic, routing, or API changes

