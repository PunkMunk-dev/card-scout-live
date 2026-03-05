

## Plan: Live Auction Sniper Feed

### Current State
The page already shows live auctions from `roi_live_auctions` joined to `roi_cards`. Nav labels already say "Live Auctions" / "Live". The main work is simplifying the UI (remove sport pills, ending-soon toggle) and always sorting by ending soonest, plus extracting a dedicated card component with live countdown.

### Changes

#### 1. `src/hooks/useLiveAuctionFeed.ts` (new)
- Query `roi_live_auctions` with 10-min grace window, ordered by `end_time ASC nulls last`
- Fetch `roi_cards` by collected IDs
- Join in JS, return `Array<{ live, card }>` already sorted ending-soonest
- 30s refetch interval
- Filter by `minProfit` param

#### 2. `src/components/roi/LiveAuctionCard.tsx` (new)
- Props: `card` (RoiCard) + `live` (LiveRoiAuction)
- Reuse `useCountdown` hook for live countdown display with color coding (urgent red < 15min, warning amber < 1hr, normal otherwise)
- Image thumbnail with fallback
- Card name, profit badge (green pill), current bid, "Open on eBay" CTA button
- Uses om-card, om-* tokens throughout

#### 3. `src/pages/TopRoi.tsx` (rewrite)
- Subtitle: "Sniper feed — auctions ending soonest"
- Toolbar: only min-profit input + "Refreshing every 30s" status text (remove sport pills, ending-soon toggle)
- Use `useLiveAuctionFeed` instead of separate `useLiveRoiAuctions` + `useRoiCards`
- Render grid of `LiveAuctionCard` components
- Keep snapshot, empty/error states

#### 4. No routing or nav changes needed
- Sidebar already says "Live Auctions", mobile tab says "Live", route is `/roi`

