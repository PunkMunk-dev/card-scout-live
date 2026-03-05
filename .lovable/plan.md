

## Plan: Add Copy and Watchlist Buttons to All Card Types

### Current State Audit

| Card Component | Watchlist Star | Copy Button |
|---|---|---|
| `TerminalCard` (TCG Lab) | Yes | Yes |
| `EbayListingCard` (Sports Lab) | Yes | Yes |
| `ListingCard` (Card Finder / Index) | Yes | **Missing** |
| `LiveAuctionCard` (ROI / Top ROI) | **Missing** | **Missing** |

### Changes

#### 1. `src/components/ListingCard.tsx` -- Add copy button
- Import `Copy`, `Check`, `useState` and `cleanListingTitle`
- Add a copy-to-clipboard button in the content area (after the "View on eBay" button or replacing it with a row containing both), matching the pattern used in `TerminalCard` and `EbayListingCard`: a small `w-8 h-8` icon button that copies the cleaned title

#### 2. `src/components/roi/LiveAuctionCard.tsx` -- Add watchlist star and copy button
- Import `Star`, `Copy`, `Check`, `useState` from lucide/react
- Import `useSharedWatchlist` from `@/contexts/WatchlistContext`
- Add a new adapter function `roiAuctionToEbayItem` in `src/lib/watchlistAdapters.ts` that converts a `RoiCard + LiveRoiAuction` pair into an `EbayItem`
- Add the watchlist star overlay on the thumbnail (top-right, same `w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm` pattern)
- Add a copy button in the card footer (copies `card.card_name` since that's the clean title for ROI cards)

#### 3. `src/lib/watchlistAdapters.ts` -- Add ROI adapter
- Add `roiAuctionToEbayItem(card: RoiCard, live: LiveRoiAuction): EbayItem` that maps `card_name` to title, `live.current_bid` to price, `live.listing_url` to itemUrl, `live.image_url` to imageUrl, etc.

### Visual Consistency
All cards will have:
- Watchlist star: top-right of image, `w-7 h-7` circle, cyan accent when active, `fill-current`
- Copy button: bottom of card content, `w-8 h-8` icon button, copies cleaned title to clipboard with check feedback

