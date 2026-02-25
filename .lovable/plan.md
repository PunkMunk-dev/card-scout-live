# Unify TCG and Sports Market Pages with OmniMarket Dark Premium Design

## Overview

Reskin both the TCG Market (`/tcg`) and Sports Market (`/sports`) pages to match the dark premium OmniMarket landing design system. This is a UI-only change -- no API calls, filtering logic, sorting logic, pagination, data models, types, or routes will be modified. Make sure to reference screenshots used for landing page UI 

### A) Global Design System Updates

**1. `src/index.css**` -- Add dark-surface utility classes

- Add `.om-surface-0`, `.om-surface-1`, `.om-surface-2` utility classes mapping to the existing `--om-bg-*` tokens
- Add `.om-card` class: `bg-[var(--om-bg-2)]` + `border border-white/[0.08]` + `rounded-2xl`
- Add `.om-card-hover` class: `hover:translate-y-[-2px] hover:border-white/[0.12] hover:shadow-[0_0_80px_rgba(0,185,255,0.08)]`
- Add `.om-input` focus ring style: `focus:ring-[0_0_0_4px_rgba(0,185,255,0.18)]`
- Add micro-interaction utility: `transition: 150ms cubic-bezier(0.16, 1, 0.3, 1)`
- Add `.om-toolbar` class for consistent toolbar styling
- Ensure existing `.glass-panel` class remains untouched (already present)

### B) TCG Market Page

**2. `src/pages/TcgLab.tsx**` -- Page shell reskin

- Change page shell: dark background `bg-[var(--om-bg-0)]` with gradient via inline style or a wrapper div
- Add optional PSA mosaic behind header area (ultra-blurred, 5-7% opacity, limited to header zone)
- Change `<main>` container to `max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8`

**3. `src/components/tcg-lab/TcgHeader.tsx**` -- Sticky "Command Bar" reskin

- Desktop: Replace `bg-card/80 backdrop-blur-md border-b border-border` with `bg-[#0E1420] border border-white/10 rounded-2xl` (or `.glass-panel`)
- Add page title "TCG Market" + subtext "Pokemon + One Piece live listings" on the left
- Move all existing filter controls into a compact horizontal row on the right
- Add optional KPI chips (results count, active filters count) as small pills
- Max-width container: `max-w-[1400px]`
- Mobile: Similar dark reskin, keep existing Sheet behavior for filters
- Restyle `QuerySummaryBar` inline to use dark tokens

**4. `src/components/tcg-lab/TerminalView.tsx**` -- Results area reskin

- Restyle the inline search input to use dark surface styling (`bg-[var(--om-bg-2)]`, `border-white/10`, focus ring)
- No logic changes

**5. `src/components/tcg-lab/ResultsToolbar.tsx**` -- Toolbar reskin

- Change to `bg-[var(--om-bg-1)] border border-white/[0.08] rounded-xl` surface
- Restyle all buttons/selects with dark tokens: `bg-[var(--om-bg-2)]`, `border-white/10`, `text-[var(--om-text-1)]`
- Active state pills: use accent color for selected state

**6. `src/components/tcg-lab/TerminalCard.tsx**` -- Card reskin

- Card: `bg-[var(--om-bg-2)] border border-white/[0.08] rounded-2xl`
- Hover: `translateY(-2px)`, border strengthens to `white/12%`
- Title: `text-[var(--om-text-0)]`, secondary info: `text-[var(--om-text-2)]`
- Price: bold `text-[var(--om-text-0)]`
- Keep all existing badges, links, watchlist star functionality

**7. `src/components/tcg-lab/SkeletonCard.tsx**` -- Match dark card skeleton

- Update to use `bg-[var(--om-bg-2)] border border-white/[0.08] rounded-2xl`
- Shimmer bars: `bg-[var(--om-bg-3)]`

**8. `src/components/tcg-lab/ResultsSkeletonGrid.tsx**` -- Update grid columns to match new layout

- Match the same grid breakpoints as TerminalGrid

### C) Sports Market Page

**9. `src/pages/SportsLab.tsx**` -- Page shell reskin

- Same dark background and container as TCG: `bg-[var(--om-bg-0)]`, `max-w-[1400px]`
- Restyle loading/error/empty states to dark premium (no bright cards)
- Keep all existing Sheet/watchlist/scroll-to-top logic

**10. `src/components/sports-lab/QueryHeader.tsx**` -- Sticky "Command Bar" reskin

- Add page title "Sports Market" + subtext "Search by player, brand, and traits" on the left
- Desktop: Dark surface `bg-[#0E1420] border border-white/10 rounded-2xl`
- Container: `max-w-[1400px]`
- Mobile: Same dark reskin, keep Sheet for filters
- Max width `1400px` instead of `6xl`

**11. `src/components/sports-lab/EbayResultsPanel.tsx**` -- Results area reskin

- Toolbar bar: `bg-[var(--om-bg-1)] border border-white/[0.08] rounded-xl`
- All filter buttons/selects: dark tokens matching TCG toolbar
- Loading/error/empty states: dark premium (icon + text on dark surface, no bright cards)
- Grid: same column layout consistency
- No logic changes to sorting/filtering/pagination/loadAll

**12. `src/components/sports-lab/EbayListingCard.tsx**` -- Card reskin

- Card: `bg-[var(--om-bg-2)] border border-white/[0.08] rounded-2xl`
- Hover: translateY(-2px) + border strengthen + transition
- Title/price/secondary text: use om-text tokens
- Keep all existing badges, profit calc, sold comps, copy button functionality

**13. `src/components/sports-lab/SkeletonCard.tsx**` -- Dark skeleton

- Match TCG skeleton styling: `bg-[var(--om-bg-2)] border border-white/[0.08] rounded-2xl`

### D) Shared Components

**14. `src/components/shared/GuidedSearchEmptyState.tsx**` -- Dark empty state

- Replace bright muted background with dark: `bg-[var(--om-bg-2)]` icon circle, `text-[var(--om-text-2)]` text
- Keep simple: icon + short text, no loud illustration

**15. `src/components/sports-lab/QuerySummaryBar.tsx**` -- Dark summary bar

- Background: `bg-[var(--om-bg-1)]/50` with subtle border
- Text colors: `text-[var(--om-text-2)]` for labels, `text-[var(--om-text-0)]` for values

### E) Shared Control Components (styling-only changes)

**16. `src/components/sports-lab/QueryHeaderDropdown.tsx**` -- Dark dropdowns

- Trigger button: `bg-[var(--om-bg-2)] border border-white/10 text-[var(--om-text-1)]`
- Focus/open: accent ring `rgba(0,185,255,0.18)`
- Dropdown panel: `bg-[var(--om-bg-1)] border border-white/10`
- Same for TraitsDropdown

**17. `src/components/sports-lab/SearchModeToggle.tsx**` -- Dark toggle

- Container: `bg-[var(--om-bg-2)]` instead of `bg-secondary`
- Active tab: accent-colored or `bg-[var(--om-accent)]`

**18. `src/components/sports-lab/QuickSearchInput.tsx**` -- Dark input

- Input: `bg-[var(--om-bg-2)] border border-white/10 text-[var(--om-text-0)]`
- Placeholder: `text-[var(--om-text-3)]`
- Focus ring: `rgba(0,185,255,0.18)`

## Micro-Interaction Polish (Applied Across All)

- All buttons: `hover:-translate-y-px active:scale-[0.98]` + `transition-all duration-150`
- All cards: `hover:-translate-y-0.5` + border intensity increase + `duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]`
- Dropdowns: subtle shadow on open, smooth height transitions
- Skeleton shimmer uses existing `animate-pulse` (no new libs)

## Consistency Rules Enforced

- Both pages share: `max-w-[1400px]` container, same typography scale, same color tokens, same border-radius (`rounded-xl`/`rounded-2xl`), same spacing rhythm
- No new sections, routes, or pages added
- All existing controls and features preserved -- only layout, spacing, typography, colors, and component styling adjusted

## What Is NOT Changed

- No API calls, search logic, filtering logic, sorting logic, or pagination logic
- No data models or types
- No routes
- No new dependencies