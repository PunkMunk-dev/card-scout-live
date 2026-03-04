

## Plan: Unified UI Cohesion Layer

After reviewing the current codebase, the AppShell/sidebar/mobile-tabs/dashboard already exist from prior work. The real gaps are: (1) no cross-app search, (2) no session persistence, (3) no shared page header component, (4) snapshot buttons still floating on TCG/Sports. Here's what to build.

### New Files

**1. `src/lib/sessionStore.ts`** — Lightweight sessionStorage helpers
- `getSession()` / `setSession(partial)` / `clearSession()`
- Keys: `lastRoute`, `globalQuery`, `tcgMode`, `sportsMode`, `roiSortKey`, `indexSortKey`, `recentSearches` (array with timestamp+route, max 10)
- On each page mount, restore relevant state; on each search submit, push to `recentSearches`

**2. `src/contexts/GlobalSearchContext.tsx`** — Cross-app search dispatch
- Context exposes `registerSearchHandler(handler)` and `submitSearch(query)`
- Each page registers its own handler on mount:
  - Index: navigates to `/?q=...` (existing behavior)
  - TCG: sets `mode='quick'`, `quickQuery=query`
  - Sports: sets `searchMode='quick'`, `quickSearchQuery=query`
  - ROI: sets `searchQuery=query`
- AppShell's top bar calls `submitSearch(query)` instead of always navigating to `/`
- Falls back to `navigate('/?q=...')` if no handler registered

**3. `src/components/shared/PageHeader.tsx`** — Consistent page header
- Props: `title`, `subtitle?`, `rightSlot?`
- Renders: h1 (text-xl md:text-2xl), subtitle (text-sm muted), optional right content
- Consistent bottom border, spacing (mb-6), max-width alignment

### Modified Files

**4. `src/components/layout/AppShell.tsx`**
- Wrap children with `GlobalSearchProvider`
- Top bar search calls `context.submitSearch(query)` instead of `navigate('/?q=...')`
- Add current section label next to logo (read from `useLocation` → map pathname to label)

**5. `src/pages/Index.tsx`**
- Register search handler via `useGlobalSearch().register(...)` on mount
- On mount, restore `sort` from `sessionStore.indexSortKey`
- On sort change, persist to sessionStore
- Move `recentSearches` read/write to use `sessionStore` (keep localStorage fallback for backward compat)
- Move snapshot button from System card into the PageHeader rightSlot

**6. `src/pages/TcgLab.tsx`**
- Register search handler: sets `mode='quick'`, `quickQuery=query`
- On mount, restore `mode` from `sessionStore.tcgMode`; persist on change
- Replace inline header with `<PageHeader title="TCG Market" subtitle="..." rightSlot={<CaptureSnapshotButton />} />`
- Remove floating `absolute top-3 right-4` snapshot placement

**7. `src/pages/SportsLab.tsx`**
- Register search handler: sets `searchMode='quick'`, `quickSearchQuery=query`
- On mount, restore `searchMode` from `sessionStore.sportsMode`; persist on change
- Remove floating snapshot placement; put in QueryHeader area or PageHeader rightSlot

**8. `src/pages/TopRoi.tsx`**
- Register search handler: sets `searchQuery=query`, scrolls to grid
- On mount, restore `sortKey` from `sessionStore.roiSortKey`; persist on change
- Replace inline h1/p with `<PageHeader title="Top ROI" subtitle="..." rightSlot={<CaptureSnapshotButton />} />`
- Remove floating snapshot placement

**9. `src/components/layout/AppSidebar.tsx`**
- Add route change listener: persist `lastRoute` to sessionStore

### Session Store Shape

```typescript
interface SessionState {
  lastRoute: string;
  globalQuery: string;
  tcgMode: 'guided' | 'quick';
  sportsMode: 'guided' | 'quick';
  roiSortKey: string;
  indexSortKey: string;
  recentSearches: { term: string; route: string; ts: number }[];
}
```

### What Does NOT Change
- No API/edge function changes
- No filter algorithm or ranking changes
- All existing hooks reused as-is
- `/ui-audit` unaffected
- Watchlist context/logic untouched
- Mobile tab bar layout preserved
- Per-app filter UIs (TcgHeader, QueryHeader, SearchFilters) stay intact

### Summary of Impact
- 3 new files (~200 lines total)
- 6 modified files (mostly adding 5-15 lines each for context registration + session restore)
- Cross-app search works from any page
- Mode/sort preferences survive tab switches
- Snapshot buttons no longer float awkwardly
- Consistent page headers across all 4 pages

