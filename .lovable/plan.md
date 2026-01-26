
# Change Sort Label from "Lowest Price" to "Price: Low-High"

## Summary

Update the sort option label from "Lowest Price" to "Price: Low-High" for clearer indication of the sort direction.

## Change

**File:** `src/components/SearchFilters.tsx`

**Line 38:** Change the SelectItem text from `Lowest Price` to `Price: Low-High`

```diff
- <SelectItem value="price_asc">Lowest Price</SelectItem>
+ <SelectItem value="price_asc">Price: Low-High</SelectItem>
```

This is a single-line text change with no impact on functionality.
