

# Fix OP Market Ingestion Pipeline

## Problem
The admin page is empty because:
1. "Run Ingestion" button doesn't exist — only "Run Grouping" which calls `action: 'group'` on an empty `ebay_listing_cache`
2. No seed data exists, so grouping produces 0 rows
3. No diagnostics to see what's happening

## Plan

### 1. Add `action: 'seed'` to the edge function
Add a new action branch in `supabase/functions/onepiece-ingest/index.ts` that inserts 10 hardcoded test listings (5 raw + 5 PSA 10 across distinct cards like OP01-001 Luffy, OP05-119 Shanks, ST21-014 Zoro, etc.) directly into `ebay_listing_cache`. This validates the full pipeline without needing a live eBay source.

### 2. Add `action: 'counts'` to the edge function
New action that returns `{ cacheCount, groupedCount }` by querying both tables with `.select('*', { count: 'exact', head: true })`.

### 3. Update the admin page UI (`AdminOnepieceMarket.tsx`)
- Add **"Seed Test Data"** button that calls `ingest.mutate({ action: 'seed' })`
- Add **"Run Ingestion"** button (same as seed for now, placeholder for real source later)
- Keep existing **"Run Grouping"** button
- Add a **diagnostics bar** below the sticky header showing:
  - Cache row count (from a `useQuery` hitting `ebay_listing_cache` with `count: 'exact'`)
  - Grouped row count (from the market query)
  - Last action result / error
- Add **toast notifications** via `sonner` for each action result (inserted X, grouped Y, errors)

### 4. Update `useOnepieceMarket.ts`
- Add `useOnepieceDiagnostics()` hook that queries counts from both tables
- Update `useOnepieceIngest` `onSuccess` to also invalidate diagnostics + listing cache queries

### 5. Add `verify_jwt = false` for onepiece-ingest in `config.toml`
The edge function uses service role key internally, but the config may need this for the anon-key call to reach it.

### Files to change
- `supabase/functions/onepiece-ingest/index.ts` — add `seed` and `counts` actions
- `src/hooks/useOnepieceMarket.ts` — add diagnostics hook, toast on mutation
- `src/pages/AdminOnepieceMarket.tsx` — add seed button, diagnostics bar, toasts

### Seed data (10 listings)
5 raw cards + 5 PSA 10 cards across 3 card identities:
- OP01-001 Luffy EN base (2 raw @ $8, $10 + 2 PSA10 @ $45, $50)
- OP05-119 Shanks JP alt art (2 raw @ $25, $30 + 1 PSA10 @ $120)
- ST21-014 Zoro EN base (2 raw @ $5, $6 + 1 PSA10 @ $35)

This ensures grouping produces 3 rows with high confidence, meeting the min sales thresholds.

