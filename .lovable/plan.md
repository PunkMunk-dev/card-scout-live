
# Fix: Sports Lab Quick Search Infinite Loop Bug

## Root Cause

The Sports Lab Quick Search has an infinite loop that prevents results from ever displaying:

1. In `SportsLab.tsx`, the `searchParams` prop is created **inline** without memoization:
   ```
   <EbayResultsPanel searchParams={{ playerName: quickSearchQuery.trim(), freeFormSearch: true }} ...
   ```
   This creates a new object reference on every render.

2. In `EbayResultsPanel.tsx`, the search effect (line 51-60) has a cleanup function that resets `lastSearchRef.current = ''` whenever the effect re-runs.

3. When search results come back, state updates (listings, loading flags, result counts) cause the parent `SportsLab` to re-render, which creates a new `searchParams` object, which triggers the effect cleanup (resetting the ref), which makes the key-check pass, which fires `search()` again -- clearing all listings and starting over.

**The cycle**: search fires -> results arrive -> state updates -> parent re-renders -> new searchParams ref -> effect cleanup resets ref -> effect fires search again -> loop forever.

## Fix (2 changes)

### 1. Memoize `searchParams` in `SportsLab.tsx`

Wrap the quick-search `searchParams` in `useMemo` so the object reference stays stable when `quickSearchQuery` hasn't changed:

```typescript
const quickSearchParams = useMemo(() => ({
  playerName: quickSearchQuery.trim(),
  freeFormSearch: true as const,
}), [quickSearchQuery]);
```

Then pass `quickSearchParams` to `EbayResultsPanel` instead of the inline object.

### 2. Remove the cleanup that resets `lastSearchRef` in `EbayResultsPanel.tsx`

The cleanup on line 59 (`return () => { lastSearchRef.current = ''; }`) defeats the purpose of the dedup check. Remove it so that `lastSearchRef` only resets when a genuinely new search key comes in:

```typescript
// Before (line 51-60)
useEffect(() => {
  if (!searchParams.playerName) return;
  const key = JSON.stringify({ ... });
  if (key !== lastSearchRef.current) {
    lastSearchRef.current = key;
    loadAllTriggeredRef.current = false;
    search(searchParams);
  }
  return () => { lastSearchRef.current = ''; };  // BUG: resets on every re-run
}, [searchParams, search]);

// After
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

## Technical Details

| File | Change |
|------|--------|
| `src/pages/SportsLab.tsx` | Memoize quick-search params with `useMemo` |
| `src/components/sports-lab/EbayResultsPanel.tsx` | Remove cleanup function from search effect (line 59) |

Both changes together break the infinite loop: the memoized params prevent unnecessary effect triggers, and removing the cleanup prevents the dedup check from being bypassed on legitimate re-runs.
