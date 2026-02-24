

# Fix: Sports Lab Guided Search Infinite Loop + Code Cleanup

## Problems Found

### 1. Guided Search Infinite Loop (Critical)
The guided search in Sports Lab has the same infinite loop bug that was fixed for quick search. In `SportsLab.tsx`, two arrays are derived inline on every render without memoization:

```
line 44: const selectedPlayerNames = filteredPlayers.filter(...).map(p => p.name);
line 47: const selectedTraitLabels = filteredRuleItems.filter(...).map(ri => ri.label);
```

These arrays get **new references on every render** and are passed to `ResultsGrid`, which uses them as `useMemo` dependencies. Since JavaScript compares arrays by reference, the memo recalculates every render, creating a new `searchParams` object, which triggers the search effect, which updates state, which re-renders, which creates new arrays -- infinite loop.

### 2. Broken Indentation in EbayResultsPanel.tsx
The last edit introduced incorrect indentation on lines 57-60 of the search effect. The logic is correct but the formatting is broken.

## Fix Plan

### File 1: `src/pages/SportsLab.tsx`
Wrap `selectedPlayerNames` and `selectedTraitLabels` in `useMemo` so their references stay stable between renders:

```typescript
// Before (new array every render)
const selectedPlayerNames = filteredPlayers.filter(p => state.selected_player_ids.includes(p.id)).map(p => p.name);
const selectedTraitLabels = filteredRuleItems.filter(ri => ri.kind === 'trait' && ...).map(ri => ri.label);

// After (stable reference)
const selectedPlayerNames = useMemo(() =>
  filteredPlayers.filter(p => state.selected_player_ids.includes(p.id)).map(p => p.name),
  [filteredPlayers, state.selected_player_ids]
);
const selectedTraitLabels = useMemo(() =>
  filteredRuleItems.filter(ri => ri.kind === 'trait' && state.selected_rule_item_ids.includes(ri.id)).map(ri => ri.label),
  [filteredRuleItems, state.selected_rule_item_ids]
);
```

### File 2: `src/components/sports-lab/EbayResultsPanel.tsx`
Fix the broken indentation in the search effect (lines 51-60) so it reads correctly:

```typescript
useEffect(() => {
  if (!searchParams.playerName) return;
  const key = JSON.stringify({ playerName: searchParams.playerName, brand: searchParams.brand, traits: searchParams.traits });
  if (key !== lastSearchRef.current) {
    lastSearchRef.current = key;
    loadAllTriggeredRef.current = false;
    search(searchParams);
  }
  return () => { lastSearchRef.current = ''; };
}, [searchParams, search]);
```

## Technical Summary

| File | Change | Why |
|------|--------|-----|
| `src/pages/SportsLab.tsx` | Memoize `selectedPlayerNames` and `selectedTraitLabels` | Prevents new array references every render, breaking the infinite loop for guided search |
| `src/components/sports-lab/EbayResultsPanel.tsx` | Fix indentation on lines 57-60 | Cosmetic fix from previous edit's broken formatting |

No changes needed to Card Finder (`Index.tsx`) or TCG Lab (`TcgLab.tsx`) -- both are functioning correctly.

