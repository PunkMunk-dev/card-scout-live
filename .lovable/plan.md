

# Improve Mobile Tap Targets for Watchlist Star

## Problem
The watchlist star button is `w-7 h-7` (28x28px) — well below the recommended 44x44px minimum for mobile tap targets. It sits inside a card-wide `<a>` tag, so missed taps open the eBay listing.

## Changes

### 1. WatchlistStar (Sports Lab) — `src/components/sports-lab/WatchlistStar.tsx`
- Increase visible button from `w-7 h-7` to `w-9 h-9` (36px) on mobile via responsive classes: `w-9 h-9 sm:w-7 sm:h-7`
- Add transparent padding ring around button for extra touch area: `before:absolute before:inset-[-6px] before:content-['']` (adds ~12px invisible hit zone, totaling ~48px effective target)
- Add `relative` to position the pseudo-element
- Bump icon from `h-3.5 w-3.5` to `h-4 w-4 sm:h-3.5 sm:w-3.5`

### 2. TerminalCard (TCG Lab) — `src/components/tcg-lab/TerminalCard.tsx`
- Same pattern: watchlist button gets `w-9 h-9 sm:w-7 sm:h-7` + `before:` pseudo-element padding
- Icon responsive sizing `h-4 w-4 sm:h-3.5 sm:w-3.5`

### 3. ListingCard (Card Finder) — `src/components/ListingCard.tsx`
- Same pattern applied to the watchlist star button

### 4. Copy button in TerminalCard and EbayListingCard
- Already `w-8 h-8` — acceptable, no change needed

All changes are purely visual/touch-target sizing. No functional changes.

