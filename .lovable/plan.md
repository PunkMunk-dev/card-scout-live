

# Premium Navigation Header Redesign

Updates only `src/components/TabNavigation.tsx` -- pure styling and label changes, no routing or functionality modifications.

## Changes

### 1. Update tab labels (lines 9-12)

Rename visible labels:
- `TCG Lab` -> `TCG Market`, shortLabel `TCG` stays
- `Sports Lab` -> `Sports Market`, shortLabel `Sports` stays

### 2. Brand wordmark lockup (lines 93-96)

Replace the single `<span>` with a stacked wordmark wrapped in a `<Link to="/">`:

```
<Link to="/" className="flex flex-col leading-none select-none shrink-0">
  <span className="text-[14px] md:text-[15px] font-semibold tracking-tight text-slate-900">OmniMarket</span>
  <span className="mt-0.5 text-[10px] tracking-[0.32em] uppercase text-slate-500">Cards</span>
</Link>
```

Add `Link` to the `react-router-dom` import.

### 3. Header container (line 91-92)

Replace the current `<header>` and inner `<div>` classes:

```
<header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
  <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8 flex h-14 md:h-16 items-center justify-between gap-4">
```

### 4. Tab styling (lines 28-57)

Replace the desktop NavLink classes with active pill styling:

- Base: `px-3 py-2 rounded-xl text-sm font-medium transition-all`
- Inactive: `text-slate-600 hover:text-slate-900 hover:bg-slate-100/70`
- Active: `text-slate-900 bg-slate-100 border border-slate-200`
- Remove the absolute bottom-bar indicator spans (no longer needed with pill style)

### 5. Search bar (lines 99-113)

Replace with premium command bar styling:

- Remove the `isFocused` width toggle (use fixed responsive widths)
- Wrapper: `w-[260px] md:w-[340px] lg:w-[420px]`
- Input: `h-10 md:h-11 rounded-xl bg-white border border-slate-200 pl-10 pr-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300`
- Icon: `absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400`
- Placeholder: `"Search any card, set, or player..."`
- Remove `isFocused` state (no longer needed)

### 6. Watchlist button alignment

The `WatchlistDropdown` already renders a `Button` with `h-11 w-11`. Update its wrapper gap to `gap-3` for better spacing with the wider search bar.

### 7. Mobile bottom bar (lines 60-87)

- Update labels to match (shortLabels unchanged, so no visible change)
- Keep existing mobile structure and styling intact
- No layout changes on mobile

## What does NOT change

- Routes (`/tcg`, `/sports`, `/`)
- Search handler logic (`handleHeaderSearch`)
- Watchlist dropdown component and behavior
- Mobile bottom navigation structure
- Any other files

