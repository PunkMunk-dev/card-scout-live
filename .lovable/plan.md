

## Plan: Filter Out Ended Auctions

### Problem
Auctions whose `end_time` has already passed sort to the top (ending-soonest) and clutter the feed with stale "Ended" items.

### Change: `src/hooks/useLiveAuctionFeed.ts`

**DB-level filter (line 32-33):** Add `.gte('end_time', new Date().toISOString())` to the Supabase query so ended auctions are excluded at the database level. This reduces payload size and avoids client-side filtering.

**JS-level safety net (lines 70-75):** After the map/join, also filter out any items where `end_time` is non-null and in the past, as a guard against clock skew or race conditions between the cutoff calculation and query execution.

Both filters use `now()` at query time, so auctions that end between refetch cycles will be dropped on the next 30-second tick.

No other files change.

