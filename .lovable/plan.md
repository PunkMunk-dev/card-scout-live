

# Unify TCG Lab Header to Match Sports Lab Layout

## Goal

Restructure the TCG Lab header so it mirrors the Sports Lab's dropdown-based layout exactly. Replace the inline Pokemon/One Piece toggle with separate labeled dropdown boxes ("TCG" and "Chase"/"Bounty"), and add a summary bar with "Select a TCG to begin searching" when no game is selected.

## Visual Change

**Current TCG Header:** Inline toggle buttons for Pokemon/One Piece, then a Radix Select for target, then a Radix Select for set.

**New TCG Header:** Separate bordered dropdown boxes matching Sports Lab style:
- **TCG** dropdown: "Select" placeholder, lists Pokemon and One Piece
- **Chase/Bounty** dropdown: appears after TCG is selected, lists targets
- **Set** dropdown: appears after target is selected (Pokemon only)
- Summary bar below: "Select a TCG to begin searching" when idle, then "Showing: TargetName . SetName . Raw Singles" when active

## Technical Details

### 1. `src/components/tcg-lab/TcgHeader.tsx` -- Major Rewrite of `guidedFilters`

Replace the game toggle buttons and Radix `<Select>` components with `QueryHeaderDropdown` components (imported from `sports-lab/QueryHeaderDropdown`):

```tsx
import { QueryHeaderDropdown } from '@/components/sports-lab/QueryHeaderDropdown';
```

Build game options array:
```tsx
const gameOptions = [
  { id: 'pokemon', label: 'Pokemon' },
  { id: 'one_piece', label: 'One Piece' },
];
```

Build target options from `targets`:
```tsx
const targetOptions = targets.map(t => ({ id: t.id, label: t.name }));
```

Replace `guidedFilters` content:
- `QueryHeaderDropdown` with `label="TCG"`, `placeholder="Select"`, `options={gameOptions}`, `selectedId={selectedGame}`, `onSelect={onGameChange}`
- `QueryHeaderDropdown` with `label={chaseName}`, `placeholder="Select"`, `options={targetOptions}`, `selectedId={selectedTarget?.id}`, `onSelect={handleTargetChange}` (only when `selectedGame` is set)
- Keep `CanonicalSetSelector` for set filtering (only when game is pokemon and target is selected)

### 2. `src/components/tcg-lab/TcgHeader.tsx` -- Replace inline `summaryBar` with `QuerySummaryBar`

Import and use the Sports Lab's `QuerySummaryBar` component instead of the custom inline summary bar:

```tsx
import { QuerySummaryBar } from '@/components/sports-lab/QuerySummaryBar';
```

However, `QuerySummaryBar` is sports-specific (playerName, brandLabel, etc.). Two options:
- **Option A**: Reuse it by mapping TCG concepts to its props (target name as playerName, set as brandLabel)
- **Option B**: Keep a TCG-specific summary but style it identically

We will go with **Option A** -- pass TCG data through the existing `QuerySummaryBar` props:
- `playerName` = `selectedTarget?.name` (or undefined when no target)
- `brandLabel` = `selectedSet?.set_name` when a specific set is chosen
- `showAllBrands` = `!selectedSetId` and target is selected (i.e., "All Sets")
- The "no player" state already shows "Select a player to begin searching" -- we will tweak the component to accept a custom idle message, OR simply render our own one-liner when no game is selected

Since the `QuerySummaryBar` says "Select a player to begin searching" when no playerName, and the user wants "Select a TCG to begin searching", we need to either:
- Add an optional `idleMessage` prop to `QuerySummaryBar`
- Or render the summary bar inline for TCG with the correct message

Simplest approach: Add an optional `idleMessage` prop to `QuerySummaryBar`.

### 3. `src/components/sports-lab/QuerySummaryBar.tsx` -- Add `idleMessage` prop

Add an optional `idleMessage?: string` prop that defaults to `"Select a player to begin searching"`. This keeps backward compatibility with Sports Lab.

### 4. Desktop and Mobile layouts

- **Desktop**: Move the summary bar outside the rounded card container (same placement as Sports Lab's `QuerySummaryBar`)
- **Mobile**: Keep the filter sheet pattern but update its content to use the new `QueryHeaderDropdown` components

### Files Changed

| File | Change |
|------|--------|
| `src/components/tcg-lab/TcgHeader.tsx` | Replace game toggle + Radix Selects with `QueryHeaderDropdown` components; replace inline summaryBar with `QuerySummaryBar` |
| `src/components/sports-lab/QuerySummaryBar.tsx` | Add optional `idleMessage` prop |

