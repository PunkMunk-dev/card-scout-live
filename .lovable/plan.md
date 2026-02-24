

# Consolidate Sports Lab Watchlist into Shared WatchlistContext

## Problem

Sports Lab maintains a separate `sports-watchlist` localStorage entry alongside the shared `ebay-card-watchlist`. This dual-storage causes desync issues (e.g., clearing watchlist from Card Finder doesn't clear the sports-specific store).

## Approach

Eliminate `SportsWatchlistContext` as a stateful provider. Replace it with a thin hook (`useSportsWatchlist`) that delegates entirely to the shared `WatchlistContext`, using the existing `sportsListingToEbayItem` adapter for conversions.

## Changes

### 1. `src/contexts/SportsWatchlistContext.tsx` -- Rewrite to thin wrapper

Remove all local state, localStorage reads/writes, and the Provider component. Replace with a simple hook:

```typescript
export function useSportsWatchlist() {
  const shared = useSharedWatchlist();
  
  return {
    watchlist: shared.watchlist,  // EbayItem[] (shared shape)
    isWatched: shared.isInWatchlist,
    toggleWatchlist: (listing: EbayListing) => {
      const item = sportsListingToEbayItem(listing);
      shared.toggleWatchlist(item);
      return !shared.isInWatchlist(listing.itemId);
    },
    removeFromWatchlist: shared.removeFromWatchlist,
    clearWatchlist: shared.clearWatchlist,
    count: shared.count,
  };
}
```

Export the `WatchlistItem` type re-pointed to the shared `WatchlistItem` from `@/types/ebay`.

### 2. `src/App.tsx` -- Remove SportsWatchlistProvider

Remove the `<SportsWatchlistProvider>` wrapper since there's no longer a separate provider. The shared `<WatchlistProvider>` already wraps everything.

### 3. `src/components/sports-lab/WatchlistPanel.tsx` -- Adapt to shared item shape

The watchlist items are now `WatchlistItem` (from `@/types/ebay`) with shape `{ itemId, title, price: { value, currency }, imageUrl?, itemUrl?, ... }` instead of the sports `EbayListing`. Update rendering:
- Price: use `item.price.value` / `item.price.currency` instead of `item.price` (number)
- Image: use `item.imageUrl` (same field name)
- Instead of passing to `EbayListingCard` (which expects sports `EbayListing`), render a simpler watchlist card inline matching the existing layout

### 4. `src/components/sports-lab/WatchlistStar.tsx` -- No changes needed

Already calls `useSportsWatchlist()` which will now delegate to the shared context. The `toggleWatchlist` signature still accepts an `EbayListing` and handles conversion internally.

### 5. Cleanup

- Remove the `sports-watchlist` localStorage key reference (users' old data will be orphaned but harmless)
- Remove `SportsWatchlistProvider` export
- Remove `addToWatchlist` from the sports hook (not used directly -- only `toggleWatchlist` is called)

## Migration Note

Users who had items in `sports-watchlist` but not in `ebay-card-watchlist` will lose those items. Since the toggle already syncs both stores, this should only affect edge cases.
