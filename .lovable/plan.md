

# Fix Sports Lab Infinite Search Loop

## Problem

The previous fix (resetting `lastSearchRef` in a cleanup function) introduced an infinite loop:

1. Effect runs, sets `lastSearchRef = key`, calls `search()` which sets `isLoading = true`
2. State change triggers re-render
3. Cleanup runs, resets `lastSearchRef = ''`
4. Effect runs again, sees key !== `''`, calls `search()` again
5. Repeat forever

The console shows the search firing every 1-2 seconds continuously, returning 63-64 results each time but never rendering them because `isLoading` stays true.

## Root Cause (Original StrictMode Bug)

The original problem was that React StrictMode unmounts and re-mounts the component, clearing the debounce timer during cleanup. On re-mount, `lastSearchRef` still held the key, so the search was skipped.

## Fix

Two changes needed:

### 1. Remove the broken cleanup from `EbayResultsPanel.tsx` (line 60-62)

Delete the `return () => { lastSearchRef.current = ''; };` cleanup that was added in the previous fix.

### 2. Fix the actual StrictMode issue in `useSportsEbaySearch.ts`

Instead of clearing the ref on unmount, make the `search` function handle being called again with the same params gracefully. The issue is that after StrictMode cleanup clears the debounce timer, the re-mounted effect skips calling `search()` because `lastSearchRef` still matches.

The proper fix: in the hook's cleanup effect (line 55-60), when `debounceTimerRef` is cleared, also reset `isLoading` to false. This way, if the debounce timer was cleared before it could fire, the UI won't be stuck on loading. Additionally, move the `setIsLoading(true)` call inside the debounce timeout callback, right before the actual fetch, instead of setting it eagerly in the `search()` function. This means:

- If StrictMode clears the timer, `isLoading` was never set to `true` in the first place
- The component re-mounts, the effect sees the same key in `lastSearchRef`, skips the call -- but since `isLoading` is `false`, it renders the empty/idle state correctly
- When the effect runs fresh (new key), `search()` is called, the debounce starts, and `isLoading` is set to `true` only when the fetch actually begins

**File: `src/components/sports-lab/EbayResultsPanel.tsx`** -- Remove lines 60-62 (the cleanup function)

**File: `src/hooks/useSportsEbaySearch.ts`** -- Move `setIsLoading(true)` from line 69 (eager, in `search()`) to inside the debounce callback (line 73, right before the fetch). Keep `setError(null)` and the pagination reset where they are since those are fine to set eagerly.

### Summary of changes:

| File | Change |
|------|--------|
| `src/components/sports-lab/EbayResultsPanel.tsx` | Remove cleanup function (lines 60-62) from search useEffect |
| `src/hooks/useSportsEbaySearch.ts` | Move `setIsLoading(true)` inside the debounce callback, after the timer fires, not when `search()` is first called |

This fixes both the infinite loop and the original StrictMode issue without requiring any ref cleanup tricks.

