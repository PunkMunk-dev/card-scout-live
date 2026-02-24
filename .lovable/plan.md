

# Fix: Remove lastSearchRef Cleanup Causing Infinite Search Loop

## Problem

After selecting a player (e.g., Saquon Barkley), the search fires repeatedly in an infinite loop (confirmed via console logs showing 6+ consecutive fetches), and the UI remains stuck on loading skeletons despite results being returned.

## Root Cause

The `lastSearchRef` cleanup added in the previous fix creates an infinite re-fetch cycle:

1. `SportsLab` computes `selectedPlayerNames` via `.filter().map()` -- creating a new array reference on every render
2. `ResultsGrid`'s `useMemo` sees a new `playerNames` reference and creates a new `searchParams` object
3. `EbayResultsPanel`'s `useEffect` re-runs because `searchParams` changed
4. The cleanup from the previous effect execution resets `lastSearchRef.current = ''`
5. The new effect sees `key !== ''` (always true) and calls `search()` again
6. `search()` updates listings state, triggering a re-render of the parent, restarting the cycle

## Solution

Remove the cleanup function from the search useEffect in `EbayResultsPanel.tsx`. The original StrictMode issue (search never firing) was already resolved by the earlier fix that replaced `supabase.functions.invoke` with direct `fetch` calls. The cleanup is now unnecessary and harmful.

### Change

In `src/components/sports-lab/EbayResultsPanel.tsx`, remove lines 60-62:

```typescript
// Before (lines 52-63):
useEffect(() => {
  if (!searchParams.playerName) return;
  const key = JSON.stringify({ ... });
  if (key !== lastSearchRef.current) {
    lastSearchRef.current = key;
    loadAllTriggeredRef.current = false;
    search(searchParams);
  }
  return () => {
    lastSearchRef.current = '';  // REMOVE this cleanup
  };
}, [searchParams, search]);

// After:
useEffect(() => {
  if (!searchParams.playerName) return;
  const key = JSON.stringify({ ... });
  if (key !== lastSearchRef.current) {
    lastSearchRef.current = key;
    loadAllTriggeredRef.current = false;
    search(searchParams);
  }
}, [searchParams, search]);
```

## Files Changed

| File | Change |
|---|---|
| `src/components/sports-lab/EbayResultsPanel.tsx` | Remove cleanup function (lines 60-62) from the search useEffect |

## Why This Works

- The deduplication via `lastSearchRef` still prevents redundant searches when props haven't meaningfully changed (same player/brand/traits)
- The direct `fetch` implementation (from the earlier fix) correctly handles StrictMode double-mounting because the debounce timer in `useSportsEbaySearch` naturally handles duplicate `search()` calls -- the second call cancels and restarts the timer
- Without the cleanup resetting the ref, the infinite loop is broken

