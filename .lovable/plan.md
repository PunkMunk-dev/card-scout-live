

## Plan: Add `limit` param to roi-auction-scanner, then trigger and test

### Problem
The `roi-auction-scanner` edge function scans ALL high-value ROI cards in one call, causing timeouts. We need a `limit` parameter so it can be invoked in small batches manually.

### Changes

#### 1. Update `supabase/functions/roi-auction-scanner/index.ts`

Parse an optional `limit` from the request body (default: scan all). When provided, slice `cardsToScan` to that limit. This lets manual invocations process a small batch (e.g., 10-20 cards) within the timeout window.

```typescript
const { limit } = await req.json().catch(() => ({}));
// After filtering fresh cards:
const toProcess = limit ? cardsToScan.slice(0, limit) : cardsToScan;
```

#### 2. Trigger and test

After deploying, invoke with `{ "limit": 20 }` to populate ~20 cards worth of auction data. Then browser-test the `/roi` page sport filter pills with the fresh data.

### Files modified

| File | Change |
|------|--------|
| `supabase/functions/roi-auction-scanner/index.ts` | Accept optional `limit` in request body, slice cards to process |

