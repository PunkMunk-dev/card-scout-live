

# Upgrade ROI eBay Listings: Accuracy, Freshness & Efficiency

## Summary

Replace the current `cleanCardName()` stripping approach (which removes set names, card numbers, and other discriminators) with a structured query builder that preserves these fields for precise eBay searches. Add server-side post-filtering to reject graded/sealed/lot listings, reduce cache TTL from 6 hours to 20 minutes, and reuse eBay OAuth tokens across requests.

---

## 1. Database Migration — `roi_ebay_cache` schema update

Add four new columns to the existing table:

| Column | Type | Notes |
|---|---|---|
| `query_text` | `text NOT NULL DEFAULT ''` | The actual eBay search string used |
| `query_hash` | `text UNIQUE` | SHA-256 of query params; new cache key |
| `expires_at` | `timestamptz NOT NULL DEFAULT now()` | Per-row TTL replaces client-side check |
| `query_version` | `int NOT NULL DEFAULT 1` | Bump to invalidate all cache on logic change |
| `refreshing_until` | `timestamptz NULL` | Thundering-herd lock |

Add index on `expires_at`. Existing `card_name` unique constraint stays for backward compat but upserts will target `query_hash`.

---

## 2. Edge Function Rewrite — `roi-ebay-listings/index.ts`

### Query Builder (`buildEbayQueries`)

Parse card names like `"Cooper Flagg 2025 Topps Chrome #251 Blue Refractor"` into:
- `nameCore`: "Cooper Flagg"
- `productLine`: "2025 Topps Chrome"
- `cardNumber`: "251"
- `variant`: "Blue Refractor"

And TCG names like `"Charizard ex (Obsidian Flames) #006/197 Special Illustration Rare"` into:
- `nameCore`: "Charizard ex"
- `setCore`: "Obsidian Flames" (from parenthetical)
- `cardNumber`: "006/197"
- `variant`: "Special Illustration Rare"

Build two queries:
- **Strict**: all tokens combined (nameCore + productLine/setCore + cardNumber + variant)
- **Fallback**: nameCore + productLine/setCore only

### Token Caching

Module-level `cachedToken` variable reused until 60s before expiry. Eliminates redundant OAuth calls.

### Cache Flow

1. Compute `queryHash = SHA-256(version|queryText|category|limit|filters)`
2. Look up by `query_hash` — if found and `expires_at > now()`, return cached
3. If expired but `refreshing_until > now()`, return stale with `{ stale: true }`
4. Set `refreshing_until = now() + 30s`, fetch from eBay, upsert result

### eBay Search

- Request `limit=25` (up from 8) to have a larger pool for filtering
- Same category `183050`, same condition filter

### Post-Filtering (new)

Reject listings whose title contains (case-insensitive):
- Graded: `psa`, `bgs`, `sgc`, `cgc`, `graded`, `slab`
- Sealed: `pack`, `packs`, `booster`, `elite trainer box`, `etb`, `box`, `case`, `tin`, `sealed`
- Junk: `lot`, `lots`, `bundle`, `break`, `random`
- Fake: `proxy`, `reprint`, `custom`

Also reject listings missing price or URL.

### Ranking

Score remaining by token overlap with parsed fields, then sort by lowest price. Return top 8.

### Strict → Fallback

If strict yields < 6 results after filtering, run fallback query, merge/dedupe by `itemId`, re-rank, take top 8.

### Cache Write

Upsert on `query_hash` with `expires_at = now() + 20 minutes`, clear `refreshing_until`.

---

## 3. Client Hook — `useRoiEbayListings`

- Change `staleTime` from 6 hours to 5 minutes
- Response shape stays compatible (listings array)
- No UI changes

---

## 4. Batch Prefetch (optional, recommended)

New edge function `roi-ebay-listings-batch`:
- Accepts `{ cards: [{ cardName }] }` (up to 25)
- For each, checks cache by `query_hash`, refreshes if expired
- Returns `Record<cardName, { listings, cached }>`

Client: after ROI cards load, silently prefetch top 10 cards so expansions feel instant. Uses `queryClient.prefetchQuery`.

---

## Files Changed

| File | Change |
|---|---|
| Migration SQL | Add 5 columns + index to `roi_ebay_cache` |
| `supabase/functions/roi-ebay-listings/index.ts` | Full rewrite with query builder, post-filter, ranking, token cache, hash-based caching |
| `supabase/functions/roi-ebay-listings-batch/index.ts` | New batch prefetch function |
| `supabase/config.toml` | Add `verify_jwt = false` for new batch function |
| `src/hooks/useRoiCards.ts` | Reduce `staleTime` to 5 min, add batch prefetch call |

