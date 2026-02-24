

# Align TCG Card UI with Sports Lab Card Design

## Overview

Restyle the TCG `TerminalCard` to match the Sports Lab `EbayListingCard` visual pattern: gradient overlay on image with price, rounded pill badges, and the same layout structure.

## Visual Changes

### Image Area
- Add bottom gradient overlay (`bg-gradient-to-t from-black/90 via-black/50 to-transparent`)
- Move price + shipping onto the image overlay (bottom-left), matching Sports Lab placement
- Top-left: "eBay" pill using `rounded-full bg-black/50 backdrop-blur-sm text-[11px] font-semibold`
- Top-right: Watchlist star (same `bg-black/50` circle style) + Auction pill (orange text) if auction type
- Auction time remaining shown next to price on the overlay (bottom-right) instead of a separate badge

### Below Image Area
- Title: `text-sm font-medium line-clamp-2 min-h-[2.5rem]` (already matches)
- Replace the row of outline `Button` components with rounded pill links matching Sports Lab:
  - **PSA 10 pill**: `rounded-full bg-destructive/80 text-destructive-foreground text-[11px] font-semibold` -- links to eBay sold PSA 10 comps
  - **Gem pill**: `rounded-full bg-blue-500/80 text-white text-[11px] font-semibold` -- links to gemrate.com
- Remove the View button (entire card is clickable via wrapping in an `<a>` tag, like Sports Lab)
- Copy button at bottom with `border-t border-border` separator, matching Sports Lab

### Removed Elements
- Remove set name / rarity tag row (not present in Sports Lab cards)
- Remove rank badge (not in Sports Lab)
- Remove separate View/Comps/Gem/Copy/Star button row

## Technical Details

### File: `src/components/tcg-lab/TerminalCard.tsx` -- Full rewrite

**Structure change:**
```
Card wrapper (border, rounded-lg, shadow)
  <a> wrapping entire card (clickable to eBay)
    Image area (aspect-square)
      Gradient overlay (bottom)
      "eBay" pill (top-left)
      Watchlist star (top-right, using shared watchlist context)
      Auction pill (top-right, if auction)
      Price + shipping (bottom-left on overlay)
      Time remaining (bottom-right on overlay, if auction)
    Content area (p-3)
      Title (text-sm, line-clamp-2)
      Pills row (PSA 10 + Gem, rounded-full)
      Copy button (bottom, border-t separator)
```

**Key implementation notes:**
- Wrap card content in `<a href={listing.itemWebUrl}>` like Sports Lab
- Use inline styled pills (`<a>` tags with `rounded-full` classes) instead of shadcn `Badge`/`Button`
- Watchlist star uses existing `useSharedWatchlist` context but styled as `bg-black/50 backdrop-blur-sm rounded-full` button
- Copy button uses `Check`/`Copy` icon toggle pattern from Sports Lab
- Remove `rank`, `activeSort`, `setName`, `rarityTag` props (no longer displayed)
- Keep `cleanTitle` logic for emoji stripping

### File: `src/components/tcg-lab/TerminalGrid.tsx` -- Minor update

Remove `activeSort` prop pass-through to `TerminalCard` since rank/sort badges are removed.

### File: `src/components/tcg-lab/TerminalView.tsx` -- Minor update

Remove `activeSort` from `TerminalCard`/`TerminalGrid` usage if passed there.

