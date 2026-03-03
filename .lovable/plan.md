

## Plan: Minimal ROI Cards with Hover Detail + eBay Image

**Goal**: Show only Raw Price and Profit on each card face, reveal all other stats on hover, and use the first eBay listing image as the card's visual placeholder.

### Changes (single file: `src/components/roi/RoiCard.tsx`)

**1. Always fetch eBay listings** — Remove the `expanded` gate so listings are always fetched (they're already prefetched for top 10). Use the first listing's `imageUrl` as the card thumbnail.

**2. Card face — minimal layout:**
```
┌──────────────────────────┐
│ [eBay image]             │
│                          │
│ Card Name                │
│ Raw $12     Profit +$108 │
└──────────────────────────┘
```
- Top: eBay listing image (first result) as `aspect-[4/3]` cover image, with a subtle loading skeleton
- Below: card name (1-2 lines), then a single row with Raw Avg on the left and PSA 10 Profit badge on the right

**3. Hover overlay — full stats:** On hover (CSS `group-hover`), show a semi-transparent overlay with PSA 9, PSA 10, Multiplier, and PSA 9 Gain. No click needed — pure CSS hover reveal.

**4. Remove expand/collapse** — No more "View Listings" button or expanded listings panel. The card links directly to eBay search or the first listing on click.

**5. ListingMini component** — Remove it (no longer used).

### Technical details

- `useRoiEbayListings` called with `card.card_name` always (not gated by `expanded`)
- First listing image: `listings?.[0]?.imageUrl` — fallback to a placeholder gradient if no image
- Hover overlay: `opacity-0 group-hover:opacity-100 transition-opacity` positioned absolute over the card
- Card becomes an `<a>` linking to first listing's `itemUrl` or eBay search
- GainBadge and fmt helpers stay, just used in the hover overlay now

