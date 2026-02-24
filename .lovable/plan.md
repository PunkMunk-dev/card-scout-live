

# Fix: Sports Lab Search Stuck on Loading Skeletons

## Root Cause

React StrictMode (in `main.tsx`) double-mounts components in development. The interaction between `EbayResultsPanel`'s deduplication logic and the debounce cleanup causes the search to silently fail:

1. First mount: `search()` is called, setting `isLoading = true` and recording the search key in `lastSearchRef`
2. StrictMode unmount: cleanup clears the debounce timer before it fires
3. Second mount: the useEffect checks `key !== lastSearchRef.current`, finds they match (ref persisted), and skips calling `search()` again

The UI is stuck showing skeletons with `isLoading = true` and no fetch ever fires.

## Fix

In `src/components/sports-lab/EbayResultsPanel.tsx`, reset `lastSearchRef.current` in a cleanup function so the deduplication check works correctly across StrictMode re-mounts.

### Change

In the useEffect that triggers the search (around line 52-60), add a cleanup that resets `lastSearchRef`:

```typescript
useEffect(() => {
  if (!searchParams.playerName) return;
  const key = JSON.stringify({ ... });
  if (key !== lastSearchRef.current) {
    lastSearchRef.current = key;
    loadAllTriggeredRef.current = false;
    search(searchParams);
  }
  return () => {
    lastSearchRef.current = '';  // <-- reset on cleanup
  };
}, [searchParams, search]);
```

This ensures that when StrictMode re-mounts the component, the search deduplication check passes and `search()` is called again, properly firing the debounced fetch.

## Files Changed

| File | Change |
|---|---|
| `src/components/sports-lab/EbayResultsPanel.tsx` | Add cleanup to reset `lastSearchRef.current` in search useEffect |

## Impact

- Fixes the infinite skeleton loading in Sports Lab
- No behavioral change in production (StrictMode is development-only)
- The debounce in `useSportsEbaySearch` still works correctly since re-calling `search()` simply clears and restarts the timer

