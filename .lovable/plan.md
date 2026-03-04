

## App Dashboard Redesign

Replace the full-viewport marketing hero on `/` (pre-search state) with a compact, app-first dashboard layout. Fix sidebar discoverability, reposition the snapshot button, and improve the top bar search UX.

### Changes

**1. `src/pages/Index.tsx` — Replace hero with compact dashboard**

The `!hasSearched` branch (lines 252–329) currently renders a `min-h-[100vh]` hero + market tiles below the fold. Replace with:

- **Compact header** (~140px): "OmniMarket Cards" title (32px) + "Find underpriced listings fast." subtitle (14px, muted). Subtle background gradient kept but reduced to ~140px height. Remove the spotlight animation and mosaic blur overlay.
- **2-column dashboard grid** (8/12 + 4/12 on `md+`, stacked on mobile):
  - **Left column**:
    - **Quick Start cards** (3 cards in a row): "Live eBay Search" (links to focus the header search input), "TCG Market" (`/tcg`), "Sports Market" (`/sports`). Each card: `om-card` style, icon + title + one-line description, hover lift.
    - **Recent Searches** section: Read from existing `omni_recent_searches_v1` localStorage. Render as clickable chips that navigate to `/?q=...`. Show "No recent searches" if empty.
    - **Suggested Searches** section: Static array of 6-8 trending search terms as pills (e.g., "Wembanyama Prizm Silver", "Charizard VMAX", "Shohei Ohtani Topps Chrome"). Clickable → navigate to search.
  - **Right column**:
    - **System card**: Contains theme toggle (Sun/Moon), CaptureSnapshotButton (moved here from floating), and a link to `/ui-audit`.
    - **Top ROI card**: Small card linking to `/roi` with TrendingUp icon.
- Remove `handleStartSearching`, `handleExploreMarkets`, `marketTilesRef`, the `psaMosaic` import, and all hero/spotlight markup.
- Remove the floating `CaptureSnapshotButton` from `absolute top-3 right-4`.

**2. `src/components/layout/AppShell.tsx` — Improve top bar search**

- Change desktop search placeholder to: `"Search player, set, card number…"`
- Add a visible search submit button (Search icon + "Search" label) at the right end of the input, inside the form. Style: `om-accent` background, white text, rounded-r-xl.
- Mobile search placeholder: `"Search player, set, card…"`

**3. `src/components/layout/AppSidebar.tsx` — Add "Dashboard" item + always show labels when expanded**

- Add `{ to: '/', label: 'Dashboard', icon: Home }` as first nav item (replace current "Search" which duplicates the top bar).
- Rename items: Dashboard, TCG Market, Sports Market, Top ROI.
- Sidebar already has tooltips when collapsed and labels when expanded — this is working. The `tooltip` prop on `SidebarMenuButton` already handles collapsed state.
- Make watchlist item always visible (not conditional on `count > 0`) — show it with count badge or "(0)" when empty.

**4. `src/components/layout/MobileTabBar.tsx` — Rename "Search" to "Home"**

- Change first tab label from "Search" to "Home" and icon from `Search` to `Home` (from lucide).

### Files touched

| File | Action |
|------|--------|
| `src/pages/Index.tsx` | Major rewrite of `!hasSearched` branch |
| `src/components/layout/AppShell.tsx` | Search input placeholder + submit button |
| `src/components/layout/AppSidebar.tsx` | Add Dashboard item, always-show watchlist |
| `src/components/layout/MobileTabBar.tsx` | Rename first tab to "Home" |

### What does NOT change
- Search logic, API calls, filter algorithms, sort behavior
- Results rendering (the `hasSearched` branch is untouched)
- Routes, `/ui-audit`, snapshot system internals
- Dark/light theme tokens, `index.css`
- Other pages (TcgLab, SportsLab, TopRoi)

