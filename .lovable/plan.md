

# Add Visible "Load More" Button Below Card Finder Grid

## Problem

The Card Finder already has pagination logic (`handleLoadMore`, `nextPage`, `isLoadingMore`) and a small "Load more" link in the toolbar header, but it's tiny and easy to miss. Users don't realize they can load more results.

## Solution

Add a prominent "Load More" button centered below the `ListingGrid`, matching the pattern already used in `TerminalGrid` (TCG Lab).

## Changes

### File: `src/pages/Index.tsx`

Add a "Load More" button section after the `ListingGrid` component, inside the results branch:

- Import `Loader2` from lucide-react and `Button` from the UI library
- After the `<ListingGrid>` render, add a conditional block: if `nextPage` exists, show a centered `<Button>` with "Load more" text (or a spinner + "Loading..." when `isLoadingMore` is true)
- The button calls the existing `handleLoadMore` function

The result block (lines 209-214) changes from just rendering `<ListingGrid>` to rendering the grid followed by the load-more button:

```
<ListingGrid items={items} ... />
{nextPage && (
  <div className="flex justify-center pt-6">
    <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={isLoadingMore}>
      {isLoadingMore ? (<><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Loading...</>) : 'Load more'}
    </Button>
  </div>
)}
```

No other files need changes -- the pagination state management and API calls are already fully wired up.
