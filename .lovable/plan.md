

## Spot-Check Results: Title-Match Validation is Too Loose

I cross-referenced 3 live auction cards against their actual eBay listings and found a significant data accuracy problem. **Bid prices are accurate**, but **auctions are being matched to the wrong cards**, causing incorrect profit/multiplier display.

### Findings

| # | roi_cards entry | eBay listing title | Bid match? | Card match? |
|---|---|---|---|---|
| 1 | Victor Wembanyama 2025 Topps **#AK-1 All Kings** | 2025-26 Topps Chrome **Go Time** (no #AK-1) | Yes ($0.99) | **Wrong card** |
| 2 | Nikola Jokic 2025 Topps **#AK-6 All Kings** | 2025-26 Topps Chrome **Inspirational Insert #IP8** | Yes ($0.99) | **Wrong card** |
| 3 | Drake Maye 2024 Prizm **#329 Hyper** | 2024 Prizm Draft Picks **#103 Purple Prizm /75** | Yes ($79.99) | **Wrong card** |

### Root Cause

In `supabase/functions/roi-auction-scanner/index.ts`, the `titleMatchesCard()` function (line ~178) only checks that the player name words appear in the listing title. It does **not** verify:
- Card number (e.g. `#AK-1` vs no match)
- Set/variant keywords (e.g. "All Kings" vs "Go Time")

So any auction for the same player in any set passes validation, and the profit figure from the `roi_cards` entry (which is specific to one card variant) gets shown against a completely different card.

### Fix: Tighten `titleMatchesCard()` in the Scanner

**File:** `supabase/functions/roi-auction-scanner/index.ts`

1. **Require card number match when available.** If the `roi_cards` entry includes a card number (e.g. `#AK-1`), the eBay title must also contain that number (normalized — strip leading zeros, handle `/` separators). If the card number is absent from the title, reject the match.

2. **Require at least one set/brand keyword match.** Extract significant tokens from `setCore` and `baseBrand` (e.g. "All Kings", "Hyper", "Prizm"). At least one multi-character token from the set name must appear in the listing title. This prevents "Topps Chrome Go Time" from matching a card catalogued as "Topps All Kings".

3. **Keep the existing player-name check** as the first gate (unchanged).

The updated logic:

```text
function titleMatchesCard(title, parsed):
  1. All player name words must appear in title (existing)
  2. If parsed.cardNumber exists:
     - normalize both (strip #, lowercase)
     - title must contain the card number token
     - if not found → reject
  3. Extract set keywords from parsed.setCore (split on spaces, filter len>2)
     - at least 1 keyword must appear in title
     - if zero match → reject
  4. Return true
```

This will significantly reduce false-positive matches without being so strict that legitimate listings get filtered out.

No frontend changes needed — the displayed data will automatically become accurate once the scanner stops writing mismatched auctions to `roi_live_auctions`.

### Optional: Cleanup Existing Bad Data

After deploying the fix, run the scanner once with a full re-scan (no `FRESH_MINUTES` skip) to replace stale mismatched rows. Alternatively, truncate `roi_live_auctions` and let the next cron cycle repopulate cleanly.

