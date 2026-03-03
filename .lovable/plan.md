

## Plan: Match ROI Grid to TCG/Sports Grid Layout

The TCG and Sports tabs use `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4`, while ROI uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3`.

### Changes (`src/pages/TopRoi.tsx`)

Update both the main grid and the skeleton grid to match the TCG/Sports column counts and gap:

- **Before**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3`
- **After**: `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4`

Two lines change (the skeleton grid at ~line 18 and the results grid at ~line 143). No other files need changes — the `RoiCard` component is already responsive and will adapt to the narrower column widths.

