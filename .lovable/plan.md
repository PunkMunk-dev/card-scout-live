
# Bug Report: 3-Way Integration Testing Results

## Test Summary

Tested Card Finder, TCG Lab, and Sports Lab across navigation, search, and watchlist flows.

## Bugs Found

### Bug 1: TCG Lab Header Watchlist Badge Never Shows Count (Code Bug)
**Severity**: Medium
**Location**: `src/components/tcg-lab/TcgHeader.tsx` (line 56-58)

The TCG Lab header star button reads from `useTcgWatchlist()`, which queries the **database** (`tcg_watchlist` table). However, the actual star toggles on TCG Lab cards use `useSharedWatchlist()`, which reads from **localStorage** (`ebay-card-watchlist`). These are two completely separate systems.

**Result**: You can star cards in TCG Lab, and those stars persist and show correctly in Card Finder (badge shows "2"), but the TCG Lab header star never displays a count.

**Fix**: Replace `useTcgWatchlist()` in `TcgHeader` with `useSharedWatchlist()` so the header badge count matches what the card star toggles actually save.

### Bug 2: Sports Lab Empty -- No Published Ruleset (Data Issue)
**Severity**: High (blocks entire Sports Lab)
**Location**: Database tables

The following tables are all empty after the remix:
- `sports` (0 rows)
- `players` (0 rows)
- `rule_items` (0 rows)
- `ruleset_versions` (0 rows with `published_at`)

**Result**: Sports Lab shows "No published ruleset available yet" and is completely non-functional.

**Fix**: Seed the database with initial sport/player/rule data, or provide an admin flow to populate it.

### Bug 3: TCG Lab Guided Mode Empty -- No Targets (Data Issue)
**Severity**: Medium (Quick Search still works)
**Location**: Database table `tcg_targets` (0 rows)

The Guided mode dropdown has no targets to select because the `tcg_targets` table is empty.

**Result**: Users can only use Quick Search mode in TCG Lab.

**Fix**: Seed `tcg_targets` and `tcg_sets` tables with initial data (Pokemon and One Piece card targets).

### Bug 4: Card Finder Search Query Lost on Navigation (Minor UX)
**Severity**: Low
**Location**: `src/pages/Index.tsx`

When navigating away from Card Finder (e.g., to TCG Lab) and back, the search query is cleared. This is expected React behavior (component unmounts), but it's a minor UX annoyance.

**Fix**: Persist search query in URL search params or in a context/localStorage.

## What Works Well

- Card Finder search returns results correctly (eBay API connected)
- Shared watchlist (localStorage) works across Card Finder and TCG Lab card stars
- Card Finder watchlist badge persists across navigation (shows correct count)
- TCG Lab Quick Search mode works end-to-end with results, filtering, and sorting
- Navigation between all three tabs is smooth with lazy loading
- BIN/Auction badges, pricing, and shipping info display correctly

## Recommended Fix Priority

1. **TCG Lab header watchlist badge** -- quick one-line code fix
2. **Seed database tables** -- needed for Sports Lab and TCG Lab Guided mode
3. **Search query persistence** -- optional UX improvement

## Technical Details

### Fix for Bug 1 (TcgHeader watchlist badge)
In `src/components/tcg-lab/TcgHeader.tsx`:
- Remove import of `useTcgWatchlist` from `@/hooks/useTcgWatchlist`
- Import `useSharedWatchlist` from `@/contexts/WatchlistContext`
- Replace `const { data: watchlist } = useTcgWatchlist()` with `const { count: watchlistCount } = useSharedWatchlist()`
- Remove the derived `const watchlistCount = watchlist?.length || 0` line

### Fix for Bugs 2 and 3 (Database seeding)
Create a database migration that inserts starter data:
- TCG targets for Pokemon (e.g., Charizard, Pikachu, Mewtwo) and One Piece
- TCG sets (e.g., Vivid Voltage, Evolving Skies, Darkness Ablaze)
- Sports data (sports, players, rule_items, and a published ruleset_version)

This requires understanding the exact schema and relationships between these tables before writing seed data.
