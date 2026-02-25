

# Fix: Hub Data Not Populating Correctly

## Problem Identified

The three hub API calls are returning almost no results because of a mismatch between the OR-style queries and the edge function's title-matching filter.

**Root cause**: `extractKeyTerms("pokemon OR \"one piece\"")` produces `["pokemon", "one", "piece"]` (since "or" is a stop word). Then `titleMatchesQuery` requires 75% of those terms to appear in each listing title. A Pokemon listing won't contain "one" and "piece", so it gets filtered out. Same problem for `rookie OR chrome OR holo` -- a listing needs 2 of 3 terms, which rarely happens.

**Result**: TCG total = 1, Sports total = 1, Featured = 1 item instead of 6.

**Secondary issue**: `loadHubData` fires twice (React StrictMode double-mount) causing duplicate network requests.

## Fix

### 1. Change hub queries in `src/pages/Index.tsx` (lines 221-224)

Replace the OR-compound queries with simpler single-concept queries that work correctly with the existing edge function filters:

| Purpose | Current query | New query |
|---------|--------------|-----------|
| TCG pulse | `pokemon OR "one piece"` | `pokemon cards` |
| Sports pulse | `panini OR topps` | `topps chrome` |
| Featured | `rookie OR chrome OR holo` | `rookie card` |

These single-concept queries will pass through `titleMatchesQuery` cleanly since all key terms will be present in relevant listings.

### 2. Prevent double-fire from StrictMode (lines 245-259)

Add a `useRef` flag to guard against the React StrictMode double-mount calling `loadHubData` twice:

```tsx
const hubLoadedRef = useRef(false);

useEffect(() => {
  const isIdleHub = !isLoading && !error && items.length === 0 && !query;
  if (!isIdleHub) return;

  const cached = readHubCache();
  if (cached?.pulse && cached?.featured) {
    setHubPulse(cached.pulse);
    setHubFeatured(cached.featured);
    return;
  }

  if (hubLoadedRef.current) return;
  hubLoadedRef.current = true;
  loadHubData();
}, [isLoading, error, items.length, query]);
```

### What does NOT change

- Edge function logic stays untouched
- Search results flow unchanged
- No new files or routes
- Cache, trending, and all other hub features remain as-is

