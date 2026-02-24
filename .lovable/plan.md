
# Make Sports Lab Dropdowns Sequential Like TCG Lab

## Change

Currently, the Player dropdown is always visible regardless of whether a Sport is selected. Update it so the Player dropdown only appears **after** a Sport is selected, mirroring the TCG Lab flow (TCG -> Chase/Bounty).

## Technical Details

### `src/components/sports-lab/QueryHeader.tsx`

In the `filterControls` block (line 53), wrap the Player dropdown with a `sportKey` condition:

**Before:**
```tsx
<QueryHeaderDropdown label="Player" ... />
```

**After:**
```tsx
{sportKey && <QueryHeaderDropdown label="Player" ... />}
```

This is a one-line change. The rest of the cascade (Brand appears after Player, Traits appear after Brand) already works the same way.

### `src/components/sports-lab/QuerySummaryBar.tsx`

Update the idle message used in the Sports Lab `QueryHeader` to say "Select a sport to begin searching" instead of "Select a player to begin searching", since the first step is now sport selection.

### `src/components/sports-lab/QueryHeader.tsx` (Summary Bar)

Pass `idleMessage="Select a sport to begin searching"` to the `QuerySummaryBar` component so the empty state tip matches the new flow.
