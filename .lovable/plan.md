

# Elevate TCG + Sports Pages into Premium Dark/Light System

## Overview
A pure styling upgrade across both market pages to create a cohesive, premium dark-first design with Apple-level polish. Zero functionality changes -- only CSS tokens, Tailwind classes, and component styling wrappers are modified.

---

## A. Global Design Tokens (`src/index.css`)

Update the `--om-*` token values to deeper, more intentional dark surfaces and ensure light mode parity:

**Dark mode updates:**
- `--om-bg-0`: `#0B0F16` (deeper black base)
- `--om-bg-1`: `#0E1420` (command bar surface)
- `--om-bg-2`: `#121A28` (card surface)
- `--om-bg-3`: `#162033` (inset/skeleton)

**Light mode updates (`:root`):**
- `--om-bg-0`: `#F5F7FA` (already correct)
- `--om-bg-2`: `#F0F3F8` (slightly cooler)
- `--om-bg-3`: `#E6EAF2` (cooler inset)

**New/updated accent tokens (both modes):**
- `--accent-blue`: `#0A84FF` (already present, ensure used)
- `--focus-ring`: `rgba(10,132,255,0.20)` (already present)

**Upgrade `.om-card` class:**
- `border-radius: 1rem` (keep)
- Hover: `translateY(-3px)`, stronger shadow `0 30px 80px rgba(0,0,0,0.55)`, border brightens to `--om-border-1`

**Upgrade `.om-command-bar` class:**
- Add `shadow: 0 20px 60px rgba(0,0,0,0.45)`
- `border-radius: 1rem` (keep)
- `padding` stays component-controlled

**Upgrade `.om-toolbar` class:**
- Remove visible border, use spacing for separation
- Consistent with command bar surface

**Upgrade `.om-btn` micro-interactions:**
- `hover: translateY(-1px)`
- `active: scale(0.98)`
- `transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1)`

**Upgrade `.om-input` focus state:**
- `box-shadow: 0 0 0 4px var(--focus-ring)`
- `border-color: var(--accent-blue)` on focus

**Add `.om-pill-active` iMessage blue glow:**
- `shadow: 0 6px 20px rgba(10,132,255,0.35)` when active

---

## B. SearchModeToggle -- iOS Segmented Control (`src/components/sports-lab/SearchModeToggle.tsx`)

Convert from pill buttons to an iOS-style segmented control:
- Wrapper: `bg-[var(--om-bg-2)]`, `rounded-full`, `p-1`, `inline-flex`
- Inactive tab: `text-[var(--om-text-2)]`
- Active tab: `bg-[var(--accent-blue)]`, `text-white`, `rounded-full`, `shadow-[0_6px_20px_rgba(10,132,255,0.35)]`
- Remove current `var(--om-accent)` background, replace with `--accent-blue`

---

## C. Command Bar Headers

### TCG Header (`src/components/tcg-lab/TcgHeader.tsx`)
- Command bar already uses `.om-command-bar` -- the CSS class upgrade handles the shadow
- Stat pill (totalCount) gets `bg-[var(--om-bg-2)]` capsule with border
- No structural changes

### Sports Header (`src/components/sports-lab/QueryHeader.tsx`)
- Same `.om-command-bar` upgrade applies
- Consistent stat pill styling

---

## D. Results Toolbar Elevation

### TCG ResultsToolbar (`src/components/tcg-lab/ResultsToolbar.tsx`)
- Already uses `.om-toolbar` -- CSS upgrade handles it
- Ensure dropdowns use consistent `rounded-xl` instead of `rounded-full`
- Result count: `font-semibold` on the number, `text-[var(--om-text-2)]` for secondary text

### Sports EbayResultsPanel toolbar (`src/components/sports-lab/EbayResultsPanel.tsx`)
- Same `.om-toolbar` upgrade applies
- Ensure dropdown triggers match: `rounded-xl`, consistent heights

---

## E. Card Grid Premiumization

### TCG TerminalCard (`src/components/tcg-lab/TerminalCard.tsx`)
- Already uses `.om-card` -- CSS upgrade adds stronger hover elevation
- PSA badge: add `shadow-[0_4px_12px_rgba(255,0,0,0.25)]`
- Gem badge: change to `bg-[var(--accent-blue)]` with `shadow-[0_4px_12px_rgba(10,132,255,0.25)]`
- Price overlay: add `drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]`
- Gradient overlay: increase to `h-24` for better readability

### Sports EbayListingCard (`src/components/sports-lab/EbayListingCard.tsx`)
- Same `.om-card` CSS upgrade
- PSA badge: add red glow shadow
- Gem badge: already blue, add blue glow shadow via GemRateBadge

### Sports GemRateBadge (`src/components/sports-lab/GemRateBadge.tsx`)
- Add `shadow-[0_4px_12px_rgba(10,132,255,0.25)]` to the badge

---

## F. Page Shell Backgrounds

### TcgLab (`src/pages/TcgLab.tsx`)
- Already uses `.om-page-bg` -- ensure it renders `min-h-screen`
- No structural changes needed

### SportsLab (`src/pages/SportsLab.tsx`)
- Already uses `.om-page-bg` -- same treatment

---

## G. QuerySummaryBar (`src/components/sports-lab/QuerySummaryBar.tsx`)
- Update background from hardcoded `rgba(14,20,32,0.5)` to `var(--om-bg-1)` for theme compatibility
- Border uses `var(--om-divider)` instead of hardcoded rgba

---

## H. Input Focus Rings
- QuickSearchInput already uses `.om-input` -- CSS upgrade handles focus ring
- TerminalView search input already uses `.om-input` -- same

---

## Files Modified (11 files, styling only)

| File | Change |
|---|---|
| `src/index.css` | Deepen dark tokens, upgrade `.om-card`/`.om-command-bar`/`.om-toolbar`/`.om-btn`/`.om-input`/`.om-pill` classes |
| `src/components/sports-lab/SearchModeToggle.tsx` | iOS segmented control with `--accent-blue` |
| `src/components/tcg-lab/TerminalCard.tsx` | Badge glow shadows, price drop-shadow, taller gradient |
| `src/components/sports-lab/EbayListingCard.tsx` | Badge glow shadows |
| `src/components/sports-lab/GemRateBadge.tsx` | Add blue glow shadow |
| `src/components/tcg-lab/ResultsToolbar.tsx` | Dropdown `rounded-xl` consistency |
| `src/components/sports-lab/EbayResultsPanel.tsx` | Dropdown `rounded-xl` consistency |
| `src/components/sports-lab/QuerySummaryBar.tsx` | Theme-aware background/border |
| `src/components/tcg-lab/TcgHeader.tsx` | Stat pill styling |
| `src/components/sports-lab/QueryHeader.tsx` | Stat pill styling consistency |
| `src/pages/TcgLab.tsx` | Ensure `min-h-screen` on page shell |

