

## Plan: Improve Auction Scanner Hit Rate and Add Debug Logging

### Problem
The `EBAY_FETCH_LIMIT` is set to 5, which combined with post-filtering (rejecting graded/sealed/etc.) often yields 0 results. There are no logs showing what queries are sent to eBay, making debugging impossible.

### Changes

#### 1. `supabase/functions/roi-auction-scanner/index.ts`

| Change | Detail |
|--------|--------|
| Increase `EBAY_FETCH_LIMIT` | `5` → `20` to pull more raw results before filtering |
| Add per-card debug logging | Log the card name, generated query, raw result count, and filtered result count for every card scanned |
| Add title-match validation | Score each auction result against the parsed card name (player name + set/brand tokens) and reject items that don't meet a minimum relevance threshold — prevents pulling unrelated auctions |
| Log summary stats | Log batch-level totals so edge function logs show overall scan performance |

#### Relevance scoring (new)

After filtering out graded/sealed/etc., score each remaining auction title against the parsed card:
- Must contain the player name (nameCore) — reject if missing
- Bonus points for set name, card number matches

This ensures pulled auctions actually match the card from the ROI list.

#### Debug log format (per card)
```
[SCAN] "Patrick Mahomes 2024 Select ..." → query="Patrick Mahomes 2024 Select" → raw=20 filtered=8 matched=3
```

### Files modified

| File | Change |
|------|--------|
| `supabase/functions/roi-auction-scanner/index.ts` | Increase fetch limit, add debug logging, add title-match validation |

