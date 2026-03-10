

# Add Real eBay Sold Listing Ingestion to onepiece-ingest

## Current State
The edge function has `seed`, `counts`, `ingest` (accepts pre-parsed listings), and `group` actions. None of them actually fetch from eBay. The `EBAY_CLIENT_ID` secret is already configured.

## Plan

### 1. Add `action: 'fetch'` to `onepiece-ingest/index.ts`

Add a new action that uses the eBay FindingService (`findCompletedItems`) — same API pattern already proven in `sports-ebay-sold-psa/index.ts`.

**Flow:**
- Accept optional `{ queries, searchType }` in the body. Default queries: a set of common One Piece card search terms (e.g., `"One Piece TCG card -lot -bundle"` for raw, `"One Piece TCG PSA 10 -lot -bundle"` for PSA 10).
- Accept optional `searchType: 'raw' | 'psa10' | 'both'` (default `'both'`).
- For each query, call `findCompletedItems` with `SoldItemsOnly=true`, category `212` (Trading Cards), up to 100 results.
- Parse each returned item through the existing title parsing pipeline (parseCardNumber, parseGrade, detectLanguage, etc.).
- Apply junk/exclusion filters.
- Upsert parsed rows into `ebay_listing_cache` using `ebay_item_id` as the dedup key.
- Return `{ action: 'fetch', fetched, parsed, inserted, skipped, errors }`.

**Key implementation details:**
- Reuse existing helper functions (isJunk, isRawExcluded, isPsa10Excluded, parseCardNumber, etc.)
- Extract price from `sellingStatus[0].currentPrice[0].__value__`
- Extract sold date from `listingInfo[0].endTime[0]`
- Extract image from `galleryURL[0]`
- Extract item ID from `itemId[0]`
- Extract URL from `viewItemURL[0]`
- Before insert, delete existing rows with matching `ebay_item_id` to avoid duplicates (or use upsert with a unique index)

**Default search queries when none provided:**
```
Raw: ["One Piece TCG card sold -lot -bundle -PSA -BGS -CGC -SGC -graded -slab"]
PSA10: ["One Piece TCG PSA 10 card sold -lot -bundle -BGS -CGC -SGC"]
```

### 2. Add unique index on `ebay_item_id` (migration)

Add a partial unique index on `ebay_listing_cache.ebay_item_id` where `ebay_item_id IS NOT NULL` so upsert works correctly for deduplication.

### 3. Update Admin UI — Add "Fetch from eBay" button

In `AdminOnepieceMarket.tsx`, add a new button next to "Seed Test Data" that calls `ingest.mutate({ action: 'fetch' })`. Show toast with fetched/parsed/inserted counts on success.

### Files Changed
- `supabase/functions/onepiece-ingest/index.ts` — add `fetchFromEbay()` helper + `action: 'fetch'` branch
- `src/pages/AdminOnepieceMarket.tsx` — add "Fetch from eBay" button
- New migration — add partial unique index on `ebay_item_id`

