

# Update WatchlistDropdown Star to Match Accent Color

## Change
Update the star icon in the top-right navigation WatchlistDropdown from `text-yellow-500 fill-yellow-500` to `text-[var(--om-accent)] fill-[var(--om-accent)]` so it matches the unified cyan accent used on all card watchlist stars.

## File Modified

### `src/components/WatchlistDropdown.tsx` (line 22)
Change the Star icon color from yellow to the cyan accent:
- **Before:** `text-yellow-500 fill-yellow-500`
- **After:** `text-[var(--om-accent)] fill-[var(--om-accent)]`

This is a single-line change that brings the header watchlist icon into alignment with every other star in the app.

