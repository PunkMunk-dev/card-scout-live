

## Plan: Optimize Landing Page Hero

Redesign the Index.tsx landing page hero to match the reference image style — removing the bottom market tiles, and replacing the current hero with a centered search-forward layout inspired by the "CardSight" reference.

### Changes

**`src/pages/Index.tsx`** — Rewrite the `!hasSearched` hero section:

1. **Remove the Market Tiles section entirely** (lines 302-328 — the TCG/Sports link cards below the fold)
2. **Remove the "Explore Markets" button** and `marketTilesRef` logic
3. **Redesign the hero** to match the reference:
   - Top: pill badge with lightning icon — "Universal Card Intelligence"
   - Center: large two-tone heading "Omni**Market**" (white + blue gradient on "Market")
   - Below: the search bar (SearchBar component or inline form) with a prominent blue "Search →" button, rendered directly in the hero (not relying on the header search)
   - Keep the existing gradient background, dot grid, mosaic blur, and spotlight effects
4. **Wire the hero search** to call the same `performSearch` + update URL params (same logic as `handleStartSearching` but inline)
5. **Remove unused imports**: `Link`, `ArrowRight`, `ChevronRight`, `handleExploreMarkets`, `marketTilesRef`

**`src/components/layout/MobileTabBar.tsx`** — No changes (the user said "bottom tcg and sports tabs" referring to the market tile cards on the landing page, not the mobile tab bar)

### Visual Structure (hero only, pre-search)

```text
┌─────────────────────────────────────────┐
│          ⚡ Universal Card Intelligence  │  ← pill badge
│                                         │
│            Omni Market                  │  ← large heading, "Market" in blue gradient
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🔍 Search any card... Jordan... │ Search → │  ← full search bar
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### What stays the same
- All search/filter/API logic untouched
- Results rendering identical
- Toolbar with sort + results count unchanged
- Background effects (gradient, spotlight, mosaic blur, dot grid) preserved
- Snapshot button preserved

