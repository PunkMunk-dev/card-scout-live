

# Faster Search Transition on Card Finder

## Problem
When you search from the header bar, the current code clears all existing results (`setItems([])`) before the API call starts. This causes the entire page to flash to a skeleton loading grid, making it feel like a full page reload even though you're staying on the same page.

## Solution
Keep the existing results visible while the new search is loading, and overlay a subtle loading indicator. The results only swap once new data arrives -- no blank/skeleton flash.

### Changes in `src/pages/Index.tsx`

1. **Stop clearing items on new search** -- Remove `setItems([])` from the URL-change effect (line 57) and from `handleSortChange`. The items will stay on screen until the API responds with new ones.

2. **Add a loading overlay instead of replacing content** -- When `isLoading` is true AND there are already items on screen, show the existing `ListingGrid` with reduced opacity and a small centered spinner overlay, rather than swapping to the full `LoadingGrid` skeleton.

3. **Only show the skeleton grid on the very first search** (when there are no existing items to display).

### Visual behavior after the change

| Scenario | Before | After |
|----------|--------|-------|
| First search (from hero) | Skeleton grid | Skeleton grid (unchanged) |
| New search while results showing | Results vanish, skeleton grid, results appear | Results dim slightly with spinner, new results fade in |
| Sort change | Results vanish, skeleton grid | Results dim, new results replace |

### Technical Detail

```
// Current (jarring):
if (isLoading) return <LoadingGrid />
else if (items.length > 0) return <ListingGrid />

// New (smooth):
if (isLoading && items.length === 0) return <LoadingGrid />  // first search only
else if (hasSearched && items.length > 0) return (
  <div className="relative">
    {isLoading && <overlay spinner />}
    <ListingGrid className={isLoading ? "opacity-50 pointer-events-none" : ""} />
  </div>
)
```

Only `src/pages/Index.tsx` needs changes. No new files or dependencies.
