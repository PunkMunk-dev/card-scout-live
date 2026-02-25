

# Light / Dark Mode Toggle

## Overview
Add a theme toggle to the navigation using `next-themes` (already installed). Make the existing dark-only design the "dark" mode, and create a clean light equivalent for all custom surface/text tokens.

## Approach
Use CSS variable swapping via the `.dark` class (already configured in Tailwind). The current hardcoded dark values become the `.dark` overrides, and new light values go in `:root`. This means all `om-*` tokens, utility classes, and inline `var(--om-*)` references automatically adapt without touching every component file.

## Files to Change

### 1. `index.html` -- Add `class="dark"` default
- Add `class="dark"` to `<html>` so the app starts in dark mode (matching current look) before JS hydrates

### 2. `src/App.tsx` -- Wrap with ThemeProvider
- Import `ThemeProvider` from `next-themes`
- Wrap the app content with `<ThemeProvider attribute="class" defaultTheme="dark" storageKey="omni-theme">`

### 3. `src/index.css` -- Split `om-*` tokens into light/dark
- Move current `--om-bg-*`, `--om-text-*`, `--om-border-*`, `--om-accent`, `--om-divider` values into a `.dark { }` block
- Add light equivalents in `:root`:
  - `--om-bg-0: #F5F7FA` (light page base)
  - `--om-bg-1: #FFFFFF` (light surface)
  - `--om-bg-2: #F0F2F5` (light card)
  - `--om-bg-3: #E5E8ED` (light skeleton)
  - `--om-text-0: #111827` (near-black)
  - `--om-text-1: #374151` (dark gray)
  - `--om-text-2: #6B7280` (medium gray)
  - `--om-text-3: #9CA3AF` (light gray)
  - `--om-border-0: rgba(0,0,0,0.08)`
  - `--om-border-1: rgba(0,0,0,0.12)`
  - `--om-divider: rgba(0,0,0,0.06)`
  - `--om-accent: #0A84FF`
- Update utility classes (`.om-card`, `.om-surface-*`, `.om-toolbar`, `.om-input`, `.om-command-bar`, `.om-dropdown`, `.om-pill`, `.om-shimmer`, `.om-page-bg`) to use `var(--om-*)` tokens instead of hardcoded hex values so they respond to theme changes
- Update `.glass-panel` to use theme-aware fills/borders

### 4. `src/components/TabNavigation.tsx` -- Theme toggle + adaptive nav
- Add a Sun/Moon icon button that calls `setTheme()` from `next-themes`
- Change header background from hardcoded `bg-[#0E1420]` to `bg-[var(--om-bg-1)]` with `border-[var(--om-border-0)]`
- Update search input to use `var(--om-*)` tokens
- Update active tab styling to use theme-aware colors

### 5. `src/pages/Index.tsx` -- Theme-aware hero (idle/hub block)
- Replace hardcoded `bg-om-bg-0`, `text-om-text-0` etc. with the same token classes (they'll now respond to theme)
- Adjust hero spotlight: in light mode, use a softer blue radial gradient (update `.omni-hero-spotlight` in CSS to be theme-aware)
- Market tile borders/shadows: swap `border-white/10` to `border-[var(--om-border-0)]`

### 6. `src/pages/TcgLab.tsx` and `src/pages/SportsLab.tsx` -- Minor token alignment
- These pages already use `om-page-bg` and `om-card` classes which will auto-adapt
- Only change: update any remaining hardcoded `border-white/10` or `bg-white/5` to use `var(--om-border-*)` tokens

## What stays the same
- All functionality, routing, API calls, search logic
- Component structure and hierarchy
- Mobile bottom nav layout
- All existing dark mode appearance (it becomes the "dark" option)

