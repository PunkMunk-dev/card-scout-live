

# Add "Load More" to TCG Lab + Verify Sports Lab

## Summary

The TCG Lab currently fetches only 100 listings with no way to load more. The Sports Lab already has "Load more" functionality built in. This plan adds pagination support to the TCG Lab and ensures both labs have a visible, working "Load more" button.

## Changes

### 1. Add `offset` support to the TCG eBay edge function

**File: `supabase/functions/tcg-ebay-search/index.ts`**

- Accept an `offset` parameter in the request body
- Pass it to the eBay Browse API via `url.searchParams.set('offset', offset.toString())`
- Return pagination metadata alongside results: `{ items, total, offset, hasMore }`
- The Browse API supports `offset` natively (0-based), so this is straightforward

### 2. Add pagination to `tcgEbayService.ts`

**File: `src/services/tcgEbayService.ts`**

- Update `searchActiveListings` to accept and pass `offset` parameter
- Return an object with `{ listings, total, hasMore, nextOffset }` instead of just a flat array
- This enables the UI to know whether more pages exist

### 3. Convert TCG Lab to `useInfiniteQuery`

**File: `src/components/tcg-lab/TerminalView.tsx`**

- Replace `useQuery` with `useInfiniteQuery` from TanStack React Query
- `getNextPageParam`: use `lastPage.nextOffset` when `lastPage.hasMore` is true
- Flatten pages: `data.pages.flatMap(p => p.listings)`
- Pass `hasNextPage` and `fetchNextPage` / `isFetchingNextPage` down to the grid

### 4. Add "Load More" button/sentinel to `TerminalGrid`

**File: `src/components/tcg-lab/TerminalGrid.tsx`**

- Add props: `hasMore`, `isLoadingMore`, `onLoadMore`
- After the card grid, render a "Load more" button when `hasMore` is true
- Show a spinner when `isLoadingMore` is true
- Optionally add an IntersectionObserver sentinel for auto-loading (matching Sports Lab pattern)

### 5. Update `ResultsToolbar` count display

**File: `src/components/tcg-lab/ResultsToolbar.tsx`**

- Show "loaded ... more available" text when there are more results, matching the Sports Lab pattern

## Sports Lab - Already Working

The Sports Lab (`EbayResultsPanel.tsx`) already has:
- A "Load more" button (line ~157)
- Auto-loading via IntersectionObserver
- `loadAll` with cancel support

No changes needed for Sports Lab pagination.

## Technical Details

### Edge function response shape change (TCG)

Before:
```text
searchActiveListings returns: EbayListing[]  (flat array)
```

After:
```text
searchActiveListings returns: { listings: EbayListing[], total: number, hasMore: boolean, nextOffset: number }
```

The edge function will return:
```text
{ items: [...], total: 500, offset: 0, hasMore: true }
```

Where `hasMore = (offset + items.length) < total`

### useInfiniteQuery setup

```text
queryKey: ['terminal-listings', 'tcg', game, activeQuery, filters]
initialPageParam: 0
getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextOffset : undefined
```

### Files changed (4 files)

| File | Change |
|------|--------|
| `supabase/functions/tcg-ebay-search/index.ts` | Accept `offset`, return pagination metadata |
| `src/services/tcgEbayService.ts` | Pass offset, return structured response |
| `src/components/tcg-lab/TerminalView.tsx` | Switch to `useInfiniteQuery`, pass pagination props |
| `src/components/tcg-lab/TerminalGrid.tsx` | Add "Load more" button and loading indicator |

