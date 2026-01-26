
# Remove Graded Sort Option

## Summary

Remove the "Graded" and "Graded Cards" sort options from both buying format modes (ALL and AUCTION).

## Changes

### 1. `src/components/SearchFilters.tsx`

**Lines 39 and 45:** Remove the graded SelectItem options

```diff
  {buyingOption === "ALL" && (
    <>
      <SelectItem value="best">Best Match</SelectItem>
      <SelectItem value="price_asc">Price: Low-High</SelectItem>
-     <SelectItem value="graded">Graded</SelectItem>
    </>
  )}
  {buyingOption === "AUCTION" && (
    <>
      <SelectItem value="raw">Raw Cards</SelectItem>
-     <SelectItem value="graded">Graded Cards</SelectItem>
    </>
  )}
```

### 2. `src/types/ebay.ts`

**Line 37:** Remove 'graded' from SortOption type

```diff
- export type SortOption = 'best' | 'price_asc' | 'end_soonest' | 'graded' | 'raw';
+ export type SortOption = 'best' | 'price_asc' | 'end_soonest' | 'raw';
```

### 3. `src/pages/Index.tsx`

**Lines 107-112:** Update the buying option change handler to remove graded check

```diff
  if (newOption === "AUCTION") {
-   // When switching to Auction, default to "Raw Cards - Ending Soon" unless already on "graded"
-   if (sort !== "graded") {
-     newSort = "raw";
-     setSort(newSort);
-   }
+   // When switching to Auction, default to "Raw Cards"
+   newSort = "raw";
+   setSort(newSort);
  } else if (newOption === "ALL") {
    // When switching to All, default to "Best Match" if on auction-specific sorts
-   if (sort === "end_soonest" || sort === "raw") {
+   if (sort === "end_soonest" || sort === "raw" || sort === "graded") {
      newSort = "best";
      setSort(newSort);
    }
  }
```

Note: The edge function can keep its graded filtering logic for future use if needed, but it won't be triggered from the UI anymore.

## Result

- "Graded" option removed from "All" buying format
- "Graded Cards" option removed from "Auction" buying format
- Switching between formats will correctly default to appropriate sort options
