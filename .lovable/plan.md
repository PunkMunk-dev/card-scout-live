

# Fix: Sports Lab Quick Search Stuck on Loading Skeletons (StrictMode)

## Problem

The previous fix correctly memoized `searchParams` but incorrectly removed the `lastSearchRef` cleanup from the search effect. This breaks React StrictMode compatibility:

1. On first mount, the effect calls `search()`, setting `isLoading=true` and starting a debounce timer
2. StrictMode simulates unmount -- the hook's cleanup clears the debounce timer and aborts the fetch
3. StrictMode remounts -- the effect runs again, but the dedup key still matches (no cleanup reset it), so the search is skipped
4. `isLoading` stays `true` forever, showing infinite skeletons with no API call

## Root Cause

Removing the cleanup was wrong in isolation. The infinite loop from before was caused by **two** bugs working together:
- Unmemoized `searchParams` (new reference every render)
- Cleanup resetting the dedup ref (allowing re-trigger)

Now that `searchParams` is properly memoized, the cleanup is safe to restore -- it will only reset on genuine unmount/remount, not on every render cycle.

## Fix

### File: `src/components/sports-lab/EbayResultsPanel.tsx`

Restore the cleanup function in the search effect (line 51-59):

```typescript
// Current (broken for StrictMode)
useEffect(() => {
  if (!searchParams.playerName) return;
  const key = JSON.stringify({ playerName: searchParams.playerName, brand: searchParams.brand, traits: searchParams.traits });
  if (key !== lastSearchRef.current) {
    lastSearchRef.current = key;
    loadAllTriggeredRef.current = false;
    search(searchParams);
  }
}, [searchParams, search]);

// Fixed (restore cleanup)
useEffect(() => {
  if (!searchParams.playerName) return;
  const key = JSON.stringify({ playerName: searchParams.playerName, brand: searchParams.brand, traits: searchParams.traits });
  if (key !== lastSearchRef.current) {
    lastSearchRef.current = key;
    loadAllTriggeredRef.current = false;
    search(searchParams);
  }
  return () => { lastSearchRef.current = ''; };
}, [searchParams, search]);
```

## Why This Is Now Safe

With both fixes in place:
- Memoized `searchParams` ensures the effect only re-runs when the query genuinely changes (no new object reference on every render)
- The cleanup ensures StrictMode's simulated unmount/remount correctly re-triggers the search on the second mount
- No infinite loop because `searchParams` reference is stable between renders

## Technical Details

| File | Change |
|------|--------|
| `src/components/sports-lab/EbayResultsPanel.tsx` | Restore `return () => { lastSearchRef.current = ''; };` in search effect |

Single one-line change. The memoization fix in `SportsLab.tsx` from the previous edit remains correct and unchanged.

