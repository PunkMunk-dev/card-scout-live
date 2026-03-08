

## Plan: PSA Integration for Sports Lab

This is a large feature with 5 layers. I'll implement them in order: database tables, edge functions, client hooks, and UI integration.

### Pre-requisite: PSA API Key

The PSA public API (`https://api.psacard.com/publicapi/cert/GetByCertNumber/{certNumber}`) requires an authorization token. No PSA secret is currently configured. I'll need to request a `PSA_API_TOKEN` secret before the cert verification function can work.

---

### 1. Database Migrations

**New table: `psa_cert_cache`**
- `id` uuid PK
- `cert_number` text UNIQUE NOT NULL
- `card_identity_key` text nullable
- `grade` text nullable
- `player_name` text nullable
- `year` text nullable
- `set_name` text nullable
- `card_number` text nullable
- `image_url` text nullable
- `raw_response_json` jsonb nullable
- `last_verified_at` timestamptz default now()
- `created_at` timestamptz default now()
- RLS: public SELECT, no INSERT/UPDATE/DELETE from client

**New table: `psa_population_mapping`**
- `id` uuid PK
- `card_identity_key` text NOT NULL
- `psa_set_name` text nullable
- `psa_subject` text nullable
- `psa_card_number` text nullable
- `psa_population_source` text default 'manual'
- `mapping_confidence` text default 'unverified'
- `is_admin_verified` boolean default false
- `last_synced_at` timestamptz nullable
- `created_at` timestamptz default now()
- UNIQUE on `card_identity_key`
- RLS: public SELECT; admin ALL

---

### 2. Edge Function: `verify-psa-cert`

- Accepts `{ cert_number }` in POST body
- Checks `psa_cert_cache` for fresh data (< 24h) — returns cached if exists
- Calls `GET https://api.psacard.com/publicapi/cert/GetByCertNumber/{cert_number}` with `Authorization: bearer {PSA_API_TOKEN}`
- Normalizes response into cache table fields
- Upserts into `psa_cert_cache`
- Returns the cert data
- `verify_jwt = false` in config, admin-gated via `getClaims` + `has_role`

---

### 3. Edge Function: `sync-psa-population`

- Admin-only, iterates `psa_population_mapping` rows
- For each mapped card, queries `psa_population` table to check freshness
- If stale (> 7 days), fetches from PSA population source (currently manual admin entry — future API integration)
- Updates `psa_population` and `card_market_metrics.population`
- Rate-limited: processes max 50 cards per invocation
- `verify_jwt = false`, admin-gated

---

### 4. Client Hook: `usePsaCertData`

New hook in `src/hooks/usePsaCertData.ts`:
- Accepts `card_identity_key`
- Queries `psa_cert_cache` where `card_identity_key` matches
- Returns `{ certData, populationData, isLoading }`
- Also queries `psa_population_mapping` + `psa_population` for population
- Pure cache reads — no live PSA calls from client
- Simple in-memory cache like `useCardMarketMetrics`

---

### 5. UI: PSA Section in `MarketIntelligencePanel`

Add a compact "PSA Data" section below the existing metrics in `MarketIntelligencePanel.tsx`:

```text
┌─────────────────────────────────┐
│ [existing Market Intel section] │
│ ...                             │
├─────────────────────────────────┤
│ 🔒 PSA Data                    │
│ Cert Status: Verified / —      │
│ Grade: PSA 10 / —              │
│ Population: 1,234 / Unavailable│
└─────────────────────────────────┘
```

- Fetches from cache only (no blocking)
- Shows "Population unavailable" when no mapping exists
- Shows "Not verified" when no cert data exists
- Does not delay card rendering (loaded via IntersectionObserver like existing metrics)

---

### 6. Admin Mapping UI in `manage-comps` Edge Function

Extend `manage-comps` with two new actions:
- `map_psa_population`: upserts a `psa_population_mapping` row linking a `card_identity_key` to PSA set/subject/card data
- `verify_psa_mapping`: sets `is_admin_verified = true` on a mapping

This uses the existing admin auth pattern. A small admin UI component (`PsaMappingControls`) will be added to the Market Intel panel, visible only to admins (same pattern as `CompManagementControls`).

---

### Files to create
- `supabase/functions/verify-psa-cert/index.ts`
- `supabase/functions/sync-psa-population/index.ts`
- `src/hooks/usePsaCertData.ts`
- `src/components/sports-lab/PsaDataSection.tsx`
- `src/components/sports-lab/PsaMappingControls.tsx`

### Files to edit
- `supabase/config.toml` — add function configs
- `supabase/functions/manage-comps/index.ts` — add mapping actions
- `src/components/sports-lab/MarketIntelligencePanel.tsx` — add PSA section
- Database migration for 2 new tables

### Secret needed
- `PSA_API_TOKEN` — PSA public API authorization token (will prompt before implementation)

### What stays unchanged
- Sold-comp engine, opportunity scoring, ROI calculator
- `EbayListingCard` layout
- `useCardMarketMetrics` hook
- All existing edge functions

