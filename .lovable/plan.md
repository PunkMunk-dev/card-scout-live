

## Plan: UI Audit Export Page + Snapshot System

This adds a `/ui-audit` page that introspects the app architecture, displays code excerpts, and provides export buttons -- plus a snapshot capture button in each of the 3 app pages.

### New Files

**1. `src/lib/uiAuditData.ts`** — Static audit data module
- Hardcoded architecture map (since we can't read files at runtime in a bundled SPA):
  - Section A: Route map (`/`, `/tcg`, `/sports`, `/roi`), shell components (`App.tsx`, `TabNavigation`), layout wrappers
  - Section B: Three app entry pages (`Index`, `TcgLab`, `SportsLab`, `TopRoi`) with key child components, state hooks, and JSX outlines
  - Section C: Providers (`ThemeProvider`, `QueryClientProvider`, `WatchlistProvider`, `TooltipProvider`), shared hooks (`useTcgData`, `useSportsEbaySearch`, `useRoiCards`, etc.), one representative fetch pathway (tcgEbayService → supabase.functions.invoke, redacted)
  - Section D: Placeholder noting no auth/gating exists (skipped per user request)
  - Section E: Tailwind config summary, `index.css` design tokens, `cn()` utility
- Each section returns `{ title, detectedComponents, codeExcerpts, notes }` arrays
- All secrets/tokens replaced with `***REDACTED***`

**2. `src/lib/uiAuditSnapshots.ts`** — Snapshot capture + storage utilities
- `captureSnapshot(appId, statePayload)` — creates a snapshot object with timestamp, route, filters, loading flags, results schema shape (Object.keys only), redacts IDs/tokens
- `getSnapshots()` / `clearSnapshots()` — localStorage CRUD (`ui_audit_snapshots_v1`)
- `exportSnapshotsJSON()` — serializes to downloadable JSON

**3. `src/components/ui-audit/CaptureSnapshotButton.tsx`** — Small floating button
- Props: `appId: string`, `getState: () => SnapshotPayload`
- Renders a small pill button ("📸 Snapshot") in top-right area
- On click: calls `captureSnapshot(appId, getState())`, shows toast "Snapshot captured"

**4. `src/pages/UIAudit.tsx`** — The audit page
- "How to Use" card at top (4-step instructions)
- Sections A–E rendered from `uiAuditData.ts` with code blocks
- "Snapshots" section: lists snapshots grouped by app, with timestamps
- Sticky footer bar with:
  - "Copy All" — copies full markdown report (sections A–E + snapshots JSON) to clipboard
  - "Download .md" — downloads as `ui-audit-report.md`
  - "Copy Snapshots JSON" — copies just snapshots
  - "Download snapshots.json"
  - "Clear Snapshots" — with confirm dialog

### Modified Files

**5. `src/App.tsx`** — Add route
- Add lazy import: `const UIAudit = lazy(() => import("./pages/UIAudit"))`
- Add route: `<Route path="/ui-audit" element={<UIAudit />} />`
- No nav entry added (dev-only URL)

**6. `src/pages/TcgLab.tsx`** — Add snapshot button
- Import `CaptureSnapshotButton`
- Add it inside the header area, passing current state: `selectedGame`, `selectedTarget`, `selectedSetId`, `mode`, `quickQuery`, `totalCount`, `isSearchLoading`

**7. `src/pages/SportsLab.tsx`** — Add snapshot button
- Same pattern: pass `sportKey`, `selectedPlayerId`, `selectedBrandId`, `selectedTraitIds`, `searchMode`, `quickSearchQuery`, `resultCount`, `isLoading`

**8. `src/pages/TopRoi.tsx`** — Add snapshot button
- Pass `sortKey`, `searchQuery`, `visibleCount`, `isLoading`, `filteredAndSorted.length`

**9. `src/pages/Index.tsx`** — Add snapshot button
- Pass `query`, `sort`, `total`, `items.length`, `isLoading`, `error`

### Snapshot Payload Shape

```text
{
  appId: "tcg" | "sports" | "roi" | "search",
  timestamp: ISO string,
  route: window.location.pathname + search,
  searchInputs: { ... },
  filters: { ... },
  pagination: { ... },
  loadingFlags: { ... },
  errorState: null | { message },
  resultsSchema: { itemKeys: string[], count: number },
  layoutMode: { ... }
}
```

### Export Format

The "Copy All" output is a single markdown document:

```text
# UI Audit Report — OmniMarket
Generated: {date}

## A) Routing + Shell
### Detected Components
- ...
### Code Excerpts
\`\`\`tsx
// App.tsx route definitions (redacted)
...
\`\`\`

## B) App Entry Pages
...

## C) Global State + Data Plumbing
...

## D) Auth / Gating
(Not implemented — skipped)

## E) Styling / Design Tokens
...

## Snapshots
\`\`\`json
[...]
\`\`\`
```

### What This Does NOT Change
- No API behavior, search logic, or data schemas
- No UI styling changes
- No business logic modifications
- No new database tables or edge functions
- Snapshot buttons are small, unobtrusive, and easily removable

