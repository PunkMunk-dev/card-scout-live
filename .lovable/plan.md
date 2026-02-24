

# Unify Font and UI Consistency Across All Three Tabs

## Problem

Each tab (Card Finder, TCG Lab, Sports Lab) was built independently and has divergent visual patterns, making the app feel like three separate apps stitched together. Key inconsistencies:

| Area | Card Finder | TCG Lab | Sports Lab |
|---|---|---|---|
| **Page header** | None (just watchlist bar + search) | Compact 48px toolbar with inline selectors | Full sticky header with title "Sports Card Lab", subtitle, mode toggle |
| **Title font** | No visible page title | None (controls only) | `text-lg font-bold` ("Sports Card Lab") |
| **Card title font** | `text-sm font-medium` (Inter) | `text-xs text-foreground/90` (Inter) | `text-[15px] font-semibold` (Inter) |
| **Card price font** | `text-xl font-bold font-display` (Space Grotesk) | `text-sm font-semibold font-mono` | `text-xl font-extrabold` (Inter) |
| **Card image aspect** | `aspect-square` (1:1) | `aspect-[3/4]` (3:4) | `aspect-square` (1:1) |
| **Card background** | `bg-card/70 backdrop-blur-xl` | `bg-card/30` | Standard `Card` component |
| **Card action buttons** | Full-width "View on eBay" outline button | Row of tiny 7px-tall buttons (View, Comps, Gem, Copy, Star) | Copy button only; whole card is a link |
| **Context/summary bar** | `ResultsHeader` with total + Load More button | `ContextBar` with `font-mono` text | `QuerySummaryBar` with different layout |
| **Empty state** | 16px icon circle, `text-lg font-semibold` title | 10px icon in square box, `text-[22px] font-semibold` title | 16px icon circle, `text-lg font-bold` title |
| **Background effects** | Decorative blur circles | None | None |

## Solution

Standardize on a single design language across all three tabs while preserving each tab's unique functionality.

### 1. Listing Cards -- Unified Visual Language

All three card components will converge on a shared style:

- **Image aspect ratio**: `aspect-square` everywhere (Card Finder and Sports Lab already use this; TCG Lab changes from 3:4)
- **Card container**: `bg-card border border-border/30 rounded-lg shadow-sm hover:shadow-md transition-shadow` (consistent across all)
- **Title**: `text-sm font-medium leading-snug line-clamp-2 min-h-[2.5rem]` (standardize on Card Finder's pattern)
- **Price**: `text-lg font-bold tabular-nums` with no `font-display` or `font-mono` overrides -- let Inter handle prices consistently
- **Shipping text**: `text-xs text-muted-foreground` everywhere

**Files changed:**
- `src/components/ListingCard.tsx` -- Remove `font-display` from price, remove `backdrop-blur-xl bg-card/70` (use solid `bg-card`)
- `src/components/tcg-lab/TerminalCard.tsx` -- Change `aspect-[3/4]` to `aspect-square`, change `bg-card/30` to `bg-card`, standardize title to `text-sm font-medium`, price to `text-lg font-bold`
- `src/components/sports-lab/EbayListingCard.tsx` -- Change title from `text-[15px] font-semibold` to `text-sm font-medium`, price from `text-xl font-extrabold` to `text-lg font-bold`

### 2. Context/Summary Bars -- Unified Pattern

All three tabs use a thin status bar below the header showing "Showing: [query] . [count] cards". Standardize on a single style:

- Height: `h-8`
- Background: `bg-secondary/10 border-b border-border/20`
- Text: `text-xs text-muted-foreground` (no `font-mono`)
- Count: `tabular-nums` for numeric alignment

**Files changed:**
- `src/components/ResultsHeader.tsx` -- Restyle to match the thin bar pattern, move "Load More" button elsewhere
- `src/components/tcg-lab/ContextBar.tsx` -- Remove `font-mono` from text
- `src/components/sports-lab/QuerySummaryBar.tsx` -- Align height/bg to match ContextBar

### 3. Empty States -- Consistent Pattern

Standardize all empty/placeholder states:

- Icon container: `w-14 h-14 rounded-full bg-muted flex items-center justify-center`
- Icon size: `h-6 w-6 text-muted-foreground`
- Title: `text-lg font-semibold` (not `font-bold`, not `text-[22px]`)
- Subtitle: `text-sm text-muted-foreground max-w-sm`

**Files changed:**
- `src/components/EmptyState.tsx` -- Minor tweak to icon container size
- `src/components/tcg-lab/TcgEmptyState.tsx` -- Change title from `text-[22px]` to `text-lg font-semibold`, use rounded-full icon container
- `src/pages/SportsLab.tsx` -- Align empty state icon/title styling

### 4. Page Layout -- Remove Card Finder Background Effects

The decorative blur circles in Card Finder make it feel visually distinct from the other two tabs. Remove them for a clean, unified look.

**Files changed:**
- `src/pages/Index.tsx` -- Remove the three `absolute` blur circle divs (lines 132-136)

### 5. Header Consistency

Card Finder currently has no page-level controls bar (just a search section). TCG Lab and Sports Lab have sticky toolbars. Since the global `TabNavigation` already provides the app-level header, remove redundant per-page titles:

- **Sports Lab QueryHeader**: Remove the "Sports Card Lab" title and "Data-Driven Card Selection" subtitle -- the tab navigation already identifies the page. Keep the filter controls and watchlist button.
- **TCG Lab**: Already has no redundant title -- no change needed.
- **Card Finder**: Already has no title -- no change needed.

**Files changed:**
- `src/components/sports-lab/QueryHeader.tsx` -- Remove the h1/p title block, keep functional controls only

## Summary of All Files Changed

| File | Changes |
|---|---|
| `src/pages/Index.tsx` | Remove decorative blur circles |
| `src/components/ListingCard.tsx` | Remove `font-display` from price, normalize card bg |
| `src/components/tcg-lab/TerminalCard.tsx` | `aspect-square`, normalize card bg/title/price font |
| `src/components/tcg-lab/TcgEmptyState.tsx` | Standardize icon/title sizing |
| `src/components/tcg-lab/ContextBar.tsx` | Remove `font-mono` |
| `src/components/sports-lab/EbayListingCard.tsx` | Normalize title/price font sizes |
| `src/components/sports-lab/QueryHeader.tsx` | Remove redundant page title |
| `src/components/sports-lab/QuerySummaryBar.tsx` | Align bg/height with ContextBar |
| `src/components/ResultsHeader.tsx` | Restyle to thin status bar |
| `src/components/EmptyState.tsx` | Minor icon container alignment |
| `src/pages/SportsLab.tsx` | Align inline empty state styling |

