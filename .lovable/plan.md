

## Plan: Edge Function to Scan eBay Auctions for ROI Cards

### What it does
A new edge function `roi-auction-scanner` that:
1. Loads all ROI cards from the database
2. Searches eBay for **auction-only** listings matching each card
3. Upserts matching auctions into `roi_live_auctions` with current bid, end time, listing URL
4. Designed to run on a cron schedule (every 15–30 minutes)

### Implementation

#### 1. New edge function: `supabase/functions/roi-auction-scanner/index.ts`

**Flow:**
- Fetch all `roi_cards` from DB (paginated, ~2000 cards)
- Process in batches of 10 concurrently to stay within eBay rate limits
- For each card, search eBay Browse API with `buyingOptions:{AUCTION}` filter and the card's `broadQueryText` (reuse the same `parseCardName`/`buildEbayQueries` logic from `roi-ebay-listings`)
- Apply the same `filterListings` reject patterns (no graded, no lots, etc.)
- For each matching auction item, upsert into `roi_live_auctions` keyed on `item_id`
- Skip cards that already have fresh auctions (last_seen_at within 15 min) to avoid redundant API calls
- Return a summary: `{ scanned, found, upserted }`

**Key details:**
- Reuses `getEbayToken()`, `parseCardName()`, `buildEbayQueries()`, `filterListings()` inline (copy from roi-ebay-listings since edge functions can't share code across directories)
- eBay search uses `filter=buyingOptions:{AUCTION}` to only get auctions
- Extracts `currentBidAmount`, `itemEndDate` from eBay response
- Limits to 5 results per card (we only need to know auctions exist)
- Uses service role key for DB writes
- Batch size of 10 concurrent cards with small delays between batches to respect eBay rate limits

**Upsert logic:**
```sql
-- ON CONFLICT on item_id, update last_seen_at + current_bid
INSERT INTO roi_live_auctions (roi_card_id, item_id, listing_url, current_bid, shipping, end_time, last_seen_at)
VALUES (...)
ON CONFLICT (item_id) DO UPDATE SET current_bid = EXCLUDED.current_bid, last_seen_at = now(), ...
```

#### 2. DB migration: Add unique constraint on `item_id`

The `roi_live_auctions` table exists but needs a unique constraint on `item_id` for upsert to work:

```sql
ALTER TABLE public.roi_live_auctions ADD CONSTRAINT roi_live_auctions_item_id_key UNIQUE (item_id);
```

#### 3. Cron schedule (pg_cron + pg_net)

Enable `pg_cron` and `pg_net` extensions, then schedule the function to run every 20 minutes:

```sql
SELECT cron.schedule('roi-auction-scan', '*/20 * * * *', $$
  SELECT net.http_post(
    url := 'https://fbfmkqdmluovjhresszd.supabase.co/functions/v1/roi-auction-scanner',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
$$);
```

#### 4. Config: disable JWT verification

In `supabase/config.toml`, add:
```toml
[functions.roi-auction-scanner]
verify_jwt = false
```

### Performance considerations
- ~2000 cards, 10 concurrent, ~200 batches with 500ms delay = ~100s total
- Edge function timeout is 150s by default, which is tight
- **Optimization**: Only scan cards with `psa10_profit > 20` (high-value cards worth tracking) — reduces to ~500-800 cards
- Skip cards with `last_seen_at` within 15 min in `roi_live_auctions` to avoid re-scanning

### Files

| File | Action |
|------|--------|
| `supabase/functions/roi-auction-scanner/index.ts` | Create |
| `supabase/config.toml` | Add verify_jwt = false |
| DB migration | Add unique constraint on `item_id` |
| DB insert (pg_cron) | Schedule cron job |

