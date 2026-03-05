

## Analysis: Profit Badge on Live Auction Cards

The profit badge currently shows `card.psa10_profit` from the `roi_cards` table. This is the **generic card-level spread** (PSA 10 avg minus raw avg), e.g. "+$10,250" for the Cooper Flagg Blue Refractor.

This is **misleading** in the live auction context because:
- A card with `raw_avg = $2,611` and `psa10_avg = $12,861` shows "+$10,250" profit
- But if the auction's current bid is $40, the *actual* potential profit is ~$12,821 (PSA10 avg minus bid)
- Conversely, if the bid is $1,575, the actual potential is ~$11,286
- The static "+$10,250" badge doesn't reflect the auction-specific opportunity at all

### Recommendation: Remove the profit badge

**File:** `src/components/roi/LiveAuctionCard.tsx`

Remove the profit badge overlay from the thumbnail area (the `{profit > 0 && ...}` block around lines 90-101). Also remove the `profit` variable declaration. The multiplier stat already stays in the stats row, which is a card-level metric that makes sense without per-auction context.

This is a ~10 line deletion, no other files affected.

