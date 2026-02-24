

# Auto-Search on Player Selection (Sports Lab)

## The Problem

When a user selects a player in Sports Lab, nothing happens until they also pick a brand or click "All Brands." This is because the `ResultsGrid` component only renders when `hasBrandOrShowAll` is true, and on a fresh player selection `show_all_brands` defaults to `false`.

## The Fix

Automatically set `show_all_brands = true` whenever a player is selected, so the search fires immediately. This is a one-line change.

## Technical Details

### File: `src/hooks/useSportsQueryBuilderState.ts`

In the `selectPlayer` callback, change the logic so `show_all_brands` always becomes `true` when a player is picked (instead of only when there are existing selections):

**Before (line 22-27):**
```ts
const selectPlayer = useCallback((playerId: string) => {
  setState(prev => {
    const hasExisting = prev.selected_rule_item_ids.length > 0 || prev.show_all_brands;
    return { ...prev, selected_player_ids: [playerId], show_all_brands: hasExisting ? prev.show_all_brands : (prev.sport_key !== null) };
  });
}, []);
```

**After:**
```ts
const selectPlayer = useCallback((playerId: string) => {
  setState(prev => ({
    ...prev,
    selected_player_ids: [playerId],
    show_all_brands: prev.show_all_brands || prev.selected_rule_item_ids.length === 0,
  }));
}, []);
```

This means:
- First player pick (no brand selected yet): auto-sets `show_all_brands = true`, search fires immediately
- Switching players after a brand is already selected: keeps the current brand/show-all state unchanged

No other files need changes -- the existing `canSearchGuided` / `hasBrandOrShowAll` check in `SportsLab.tsx` will evaluate to `true` and render the `ResultsGrid`.

