

# Fix: Sports Lab Search Stuck on Loading Skeletons

## Root Cause

React 18 StrictMode double-mount behavior causes the search to never execute:

1. **First mount**: The search effect runs, sets `lastSearchRef.current = key`, calls `search()` which sets `isLoading=true` and starts a 150ms debounce timer
2. **StrictMode unmount**: The cleanup effect in `useSportsEbaySearch` clears the debounce timer (the actual fetch never runs)
3. **Second mount**: The search effect runs again, but `lastSearchRef.current` already equals `key`, so `search()` is never called
4. **Result**: `isLoading` stays `true` forever, skeletons show indefinitely, no network request fires

This was introduced when we moved `setIsLoading(true)` outside the debounce timer. Previously, `isLoading` was set inside the timer callback, so when the timer was cleared on unmount, `isLoading` remained `false` and the component showed the empty state instead of infinite skeletons.

## Fix

**File: `src/components/sports-lab/EbayResultsPanel.tsx`**

Reset `lastSearchRef.current` in a cleanup function for the search effect. This ensures that when React StrictMode remounts the component, the search key comparison sees a fresh state and re-triggers `search()`.

Change the search effect from:
```text
useEffect(() => {
    if (!searchParams.playerName) return;
    const key = JSON.stringify(...);
    if (key !== lastSearchRef.current) {
      lastSearchRef.current = key;
      loadAllTriggeredRef.current = false;
      search(searchParams);
    }
  }, [searchParams, search]);
```

To:
```text
useEffect(() => {
    if (!searchParams.playerName) return;
    const key = JSON.stringify(...);
    if (key !== lastSearchRef.current) {
      lastSearchRef.current = key;
      loadAllTriggeredRef.current = false;
      search(searchParams);
    }
    return () => { lastSearchRef.current = ''; };
  }, [searchParams, search]);
```

Adding `return () => { lastSearchRef.current = ''; }` resets the ref on cleanup, so the second StrictMode mount will see a fresh key and re-call `search()`.

## Files Changed

| File | Change |
|------|--------|
| `src/components/sports-lab/EbayResultsPanel.tsx` | Add cleanup to search effect that resets `lastSearchRef` |

This is a one-line fix that resolves the infinite loading skeleton issue.

