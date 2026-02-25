

# Redesign Home Page Idle/Hub Block

Scoped to the idle/hub render block only (lines 202-232 of `src/pages/Index.tsx`). No changes to imports (except swapping icons), state, handlers, API calls, routing, or any other render states.

## Changes

### `src/pages/Index.tsx` (lines 202-232 only)

Replace the entire idle/hub `<div>` with the premium hero layout:

1. **Outer wrapper**: A `rounded-3xl` container with subtle gradient background (`from-slate-50 via-white to-slate-50`), border, and decorative elements (cyan/blue glow blobs + dot grid pattern) -- all `pointer-events-none` and absolute positioned.

2. **Wordmark lockup**: Replaces "Welcome to OmniMarket Cards" with the stacked `OMNIMARKET` / `Cards` typographic lockup using specified sizes and tracking.

3. **Hero copy**: "Discover the market before it moves." headline + descriptive subtext.

4. **Value chips row**: Three static pills -- "Live Listings", "Undervalued Finds", "Clean Results" -- no data dependencies.

5. **Market tiles** (replaces current Lab cards):
   - **TCG Market** (was "TCG Lab") -- links to `/tcg` (unchanged route), uses `FlaskConical` icon, solid CTA button styled `bg-slate-900 text-white rounded-xl`.
   - **Sports Market** (was "Sports Lab") -- links to `/sports` (unchanged route), uses `Trophy` icon, same CTA style.
   - Tiles get premium styling: `rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all`.
   - Grid: `grid-cols-1 md:grid-cols-2` for mobile stacking.

6. **Trending Now ticker**: Static horizontally-scrollable pill row with 6 placeholder items. Hidden scrollbar. No API calls.

### Import adjustment (line 4)
No new imports needed -- `FlaskConical`, `Trophy`, `ArrowRight` are already imported. `ArrowRight` is still used in the CTA buttons.

## What does NOT change
- All imports besides potential icon swaps
- `deriveBuyingOptions`, all state variables, `performSearch`, all handlers
- Results toolbar, loading skeleton, error state, results grid, empty results state
- Pagination logic, toasts, watchlist logic, API calls
- Route destinations (`/tcg` and `/sports`)

