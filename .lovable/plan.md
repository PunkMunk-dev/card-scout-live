

# Enlarge Card Finder Watchlist Dropdown

The Card Finder watchlist is currently a small popover (320px wide, max 288px tall) with tiny 40x40px thumbnails. This makes it hard to identify cards.

## Changes

### File: `src/components/WatchlistDropdown.tsx`

1. **Widen the popover**: Change `w-80` (320px) to `w-96` (384px)
2. **Increase max scroll height**: Change `max-h-72` (288px) to `max-h-[28rem]` (448px)
3. **Enlarge card thumbnails**: Change image from `w-10 h-10` (40px) to `w-20 h-20` (80px), and use `object-contain` instead of `object-cover` so the full card is visible
4. **Increase row padding**: Change item padding from `p-2` to `p-3` for better spacing
5. **Bump title text size**: Change title from `text-xs` to `text-sm` for readability

These are all single-line Tailwind class changes -- no logic or structural changes needed.

