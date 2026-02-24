

# Mirror Sports Lab Header Style in TCG Lab

## What Changes

Refactor the TCG Lab header (`TcgHeader.tsx`) to use the same layout structure, components, and styling as the Sports Lab `QueryHeader.tsx`:

1. **Replace custom mode toggle** with the shared `SearchModeToggle` component (rounded-full pill with primary color active state instead of the current square bg-secondary toggle)
2. **Replace inline quick search input** with the shared `QuickSearchInput` component (includes debounce, clear button, Enter-to-submit)
3. **Match the desktop layout**: sticky container with `bg-card/80 backdrop-blur-md border-b border-border mx-2 mt-2 rounded-xl`, inner `max-w-6xl mx-auto px-4`, flex row with mode toggle on the left, guided filters + watchlist on the right
4. **Match the mobile layout**: same sticky card with `SearchModeToggle` scaled down, `QuickSearchInput` below when in quick mode, watchlist button on the right
5. **Add a summary bar** below the header (reuse or create a `TcgSummaryBar` similar to `QuerySummaryBar`) showing the active game, target, set, and result count

## Technical Details

### File: `src/components/tcg-lab/TcgHeader.tsx`

- Import `SearchModeToggle` from `@/components/sports-lab/SearchModeToggle`
- Import `QuickSearchInput` from `@/components/sports-lab/QuickSearchInput`
- Remove the custom mode tabs div (lines 74-95) and inline search input (lines 99-109)
- Restructure the desktop return to match Sports Lab pattern:

```
sticky top-0 z-40
  bg-card/80 backdrop-blur-md border-b border-border mx-2 mt-2 rounded-xl
    max-w-6xl mx-auto px-4
      flex items-center justify-between py-4 gap-x-4
        LEFT:  SearchModeToggle
        RIGHT: (quick ? QuickSearchInput : game toggle + target + set selectors) + watchlist
```

- Add mobile layout using `useIsMobile` hook, mirroring Sports Lab's mobile pattern with Sheet for filters
- Wire the `QuickSearchInput` with proper debounced `onQuickQueryChange` callback

### File: `src/pages/TcgLab.tsx`

- No changes needed -- `mode`, `onModeChange`, `quickQuery`, `onQuickQueryChange` props already exist

### Summary of visual changes

| Element | Current (TCG) | After (matching Sports) |
|---|---|---|
| Mode toggle | Square tabs, bg-secondary/40, border | Rounded-full pill, primary color active |
| Quick search | Basic Input with Search icon | `QuickSearchInput` with debounce, clear X, Enter support |
| Container | `border-b border-border/30 bg-card/50` flat bar | `bg-card/80 backdrop-blur-md border-b border-border mx-2 mt-2 rounded-xl` floating card |
| Layout | Single `h-12` row | `py-4` padded flex with toggle left, controls right |
| Mobile | Same as desktop | Dedicated mobile layout with Sheet filters |

