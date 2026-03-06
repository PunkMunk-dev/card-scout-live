

## Plan: Add Countdown Timer Badges to Sports Lab and TCG Lab Auction Cards

### Summary
Extract the `AuctionCountdownBadge` from `ListingCard.tsx` into a shared component and use it in all three card types. Sports Lab has `itemEndDate` (ISO timestamp) so it works directly with `useCountdown`. TCG Lab only has a pre-formatted `timeRemaining` string and no raw end date, so it needs a static display variant.

### Changes

**1. Extract shared `AuctionCountdownBadge` component**
- Create `src/components/shared/AuctionCountdownBadge.tsx` with the existing badge logic from `ListingCard.tsx`.
- Support two modes: `endDate` prop (live countdown via `useCountdown`) or `timeRemaining` string prop (static display).
- Update `ListingCard.tsx` to import from the shared component instead of defining it inline.

**2. Add to Sports Lab card (`EbayListingCard.tsx`)**
- Import shared `AuctionCountdownBadge`.
- Render it inside the image container when `isAuction && listing.itemEndDate`, passing `endDate={listing.itemEndDate}`.
- Remove the existing inline `timeRemaining` text display (line 74) and the manual countdown `useEffect` + state (lines 17-18, 31-43) since the shared component handles it.

**3. Add to TCG Lab card (`TerminalCard.tsx`)**
- Import shared `AuctionCountdownBadge`.
- Render it inside the image container when `isAuction && listing.timeRemaining`, passing `timeRemaining={listing.timeRemaining}`.
- Remove the existing inline time display (lines 69-74).

**4. Add `itemEndDate` to TCG EbayListing type (optional improvement)**
- Add optional `itemEndDate?: string` to `src/types/tcg.ts` `EbayListing` interface.
- If `tcg-ebay-search` edge function already returns it, map it through. If not, fall back to the static `timeRemaining` string display.

### Files to edit
- `src/components/shared/AuctionCountdownBadge.tsx` (new)
- `src/components/ListingCard.tsx` (import shared component, remove inline definition)
- `src/components/sports-lab/EbayListingCard.tsx` (add badge, remove manual countdown logic)
- `src/components/tcg-lab/TerminalCard.tsx` (add badge)

