

# Fix Sports Lab Quick Search Hanging on Loading Skeletons

## Root Cause

React 18 StrictMode double-mounts components in development. The search flow in `EbayResultsPanel` has a race condition:

1. First mount: `search()` sets `isLoading = true` and starts a 400ms debounce timer
2. StrictMode cleanup: clears the debounce timer (which would have made the actual fetch)
3. Re-mount: the useEffect sees the same search key in `lastSearchRef`, so it skips calling `search()` again
4. Result: infinite loading state -- the fetch never fires

## Fix

### File: `src/components/sports-lab/EbayResultsPanel.tsx`

Reset `lastSearchRef.current` in the cleanup of the search-trigger useEffect. This way, on re-mount the key check will pass and `search()` will be called again with a fresh timer.

**Current code (lines 63-70):**
```typescript
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

**Fixed code:**
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
    lastSearchRef.current = '';
  };
}, [searchParams, search]);
```

Adding a cleanup that resets `lastSearchRef` ensures that when StrictMode re-mounts, the key check passes and `search()` is called again with a fresh debounce timer that will actually execute the fetch.

## Impact

- Fixes the Quick Search mode in Sports Lab (currently completely broken -- shows infinite skeletons)
- Fixes the Guided Search mode as well (same code path)
- No behavioral change in production (StrictMode double-mount only happens in development, but the cleanup is harmless in production since the effect only re-runs when searchParams actually change)

