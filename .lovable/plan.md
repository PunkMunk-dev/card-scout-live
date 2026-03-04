

## Assessment: UI Overhaul Scope

This request describes a **complete UI architecture rewrite** across 11 steps. After thorough analysis of the current codebase, here is an honest assessment and a realistic plan.

### What Already Exists (and works well)
- **Shared shell**: `TabNavigation` with logo, global search, app switcher, theme toggle, watchlist
- **Design tokens**: Comprehensive `om-*` CSS variable system with light/dark parity
- **Shared components**: `om-card`, `om-btn`, `om-input`, `om-pill`, skeleton loaders, empty states
- **Shared watchlist**: Single `WatchlistContext` used across all 3 apps
- **Lazy loading**: All app pages are lazy-loaded with `React.lazy`
- **Mobile layout**: Bottom tab bar on mobile, sticky header on desktop
- **Consistent card design**: `TerminalCard` (TCG) and `EbayListingCard` (Sports) already share near-identical visual structure (om-card, aspect-square image, price overlay, PSA/Gem badges, copy button)

### Why a Full Sidebar Shell Rewrite is Risky

The request asks to replace the current top-bar + bottom-tab navigation with a sidebar rail layout (Bloomberg/Linear style). This is a **massive structural change** that:

1. **Breaks the mobile UX** — The current bottom tab bar is iOS/Android native convention. A sidebar rail on mobile requires a completely different interaction model.
2. **Conflicts with existing per-app headers** — TCG and Sports both have sticky "command bar" headers with app-specific filters. A unified `AppShell` would need to accommodate these different filter structures.
3. **The "shared components" already exist** — `ListingCard`, `TerminalCard`, and `EbayListingCard` are already very similar. Forcing them into one `ResultCard` would break the different data shapes (TCG listings vs Sports listings vs Universal search items have different fields).
4. **Virtualization for 50+ items** requires adding a new dependency (`react-window` or `@tanstack/virtual`) and restructuring all grid layouts.

### Recommended Phased Approach

Rather than attempting all 11 steps at once (which would be 2000+ lines of changes with high breakage risk), I recommend **Phase 1** focused on the highest-impact, lowest-risk improvements:

---

### Phase 1 Plan (Implementable Now)

**1. Unified AppShell with Collapsible Sidebar (Desktop) + Bottom Tabs (Mobile)**
- Create `AppShell` layout component wrapping all routes
- Desktop: slim left rail (icon-only, ~56px) with app icons + expand on hover showing labels
- Mobile: keep existing bottom tab bar (proven UX)
- Move logo, theme toggle, watchlist into shell
- Keep per-app headers (TcgHeader, QueryHeader) as-is — they contain app-specific filter logic

**2. Persistent Search Query Across Apps**
- Store `globalSearchQuery` in a new lightweight context
- When switching apps, carry the search term (each app interprets it in its own way)
- Already partially implemented via URL params (`?q=`)

**3. Active Filter Chips**
- Add a shared `ActiveFilterChips` component that reads current filters and displays removable chips above results
- Each app maps its filters to chip format
- "Clear All" button

**4. Standardized Empty/Error/Loading States**
- Create `UnifiedEmptyState`, `UnifiedErrorState` using `om-*` tokens consistently
- Replace the 3 different empty states (`EmptyState`, `GuidedSearchEmptyState`, and inline error divs)

**5. Card Hover Elevation + Image Lazy Loading**
- Already partially implemented (`om-card:hover` has translateY)
- Add `loading="lazy"` consistently (already on Sports/TCG cards, missing on Index `ListingCard`)
- Standardize hover shadow depth

**6. Spacing + Typography Consistency**
- Audit and standardize: all result titles → `text-sm font-medium`, all prices → `text-lg font-bold tabular-nums`, all metadata → `text-[11px]`
- Already 90% consistent across TerminalCard and EbayListingCard

### Files Changed (Phase 1)

| File | Change |
|------|--------|
| `src/components/layout/AppShell.tsx` | **New** — sidebar rail + main content wrapper |
| `src/components/layout/AppSidebar.tsx` | **New** — icon rail with TCG/Sports/ROI/Search/Watchlist |
| `src/components/shared/ActiveFilterChips.tsx` | **New** — removable filter chip bar |
| `src/components/shared/UnifiedEmptyState.tsx` | **New** — consolidated empty state |
| `src/components/shared/UnifiedErrorState.tsx` | **New** — consolidated error state |
| `src/App.tsx` | Wrap routes in `AppShell`, remove standalone `TabNavigation` |
| `src/pages/Index.tsx` | Use `UnifiedEmptyState`/`UnifiedErrorState` |
| `src/pages/TcgLab.tsx` | Use unified states |
| `src/pages/SportsLab.tsx` | Use unified states |
| `src/pages/TopRoi.tsx` | Use unified states, add filter chips |
| `src/index.css` | Add sidebar rail styles, spacing utility classes |

### What Phase 1 Does NOT Change
- No API endpoints, fetch logic, or ranking changes
- No filter algorithm changes
- No business logic modifications
- TCG/Sports per-app headers remain (they contain app-specific filter dropdowns)
- `/ui-audit` continues to work
- Card rendering logic stays intact (each app's card component is preserved)

### Phase 2 (Future, after Phase 1 is validated)
- Virtualized result grids (requires `@tanstack/virtual`)
- Unified `ResultCard` component (requires reconciling TCG/Sports/Universal data shapes)
- Mobile filter drawer (slide-up sheet for filters)
- Debounced search with skeleton transition
- Saved searches feature

This phased approach delivers the "professional terminal" feel (sidebar rail, consistent spacing, unified states) without risking breakage of the working search/filter/API logic.

