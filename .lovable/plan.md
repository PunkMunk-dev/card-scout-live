

## Plan: Opportunity Scoring, Comp Transparency, and Admin Comp Management

This plan adds three layers: (1) an opportunity score badge on each listing card, (2) match-reason annotations on comps, and (3) an admin comp management edge function with a lightweight UI.

---

### 1. Opportunity Score Engine (client-side)

**New file: `src/lib/opportunityScore.ts`**

Pure function that takes a listing price, `CardMarketMetrics`, and assumptions (grading cost = $25, gem rate = 50%) and returns:

```text
interface OpportunityScore {
  label: 'Strong Buy' | 'Potential Flip' | 'Neutral' | 'Overpriced';
  color: string;                // green / blue / gray / red
  upsideDollars: number | null; // psa10Median - listingPrice - gradingCost
  expectedProfit: number | null;// upsideDollars * gemRate
  modeledRoi: number | null;   // expectedProfit / (listingPrice + gradingCost) * 100
  gated: boolean;               // true if not enough exact data
  reason: string;               // human-readable explanation
}
```

**Gating rules**: Only score when confidence === 'full' (raw_comp_count >= 3, psa10_comp_count >= 2). Otherwise return `{ gated: true, label: 'Neutral', reason: 'Insufficient exact-match data' }`.

**Scoring thresholds** (on modeled ROI):
- Strong Buy: ROI >= 100%
- Potential Flip: ROI >= 25%
- Neutral: ROI >= -10%
- Overpriced: ROI < -10%

### 2. Opportunity Badge on Listing Card

**Edit: `src/components/sports-lab/EbayListingCard.tsx`**

- Import `computeOpportunityScore` and `useCardMarketMetrics` results
- After the Market Intelligence panel loads, compute the score from the listing price + metrics
- Display a small colored badge below the price overlay (inside the card body, near Est. Profit):
  - Badge text = label (e.g. "Strong Buy")
  - If gated, show a dimmed "Limited Data" chip instead
  - Show upside dollars and modeled ROI when available

### 3. Comp Match Reasons

**Edit: `src/hooks/useCardMarketMetrics.ts`**
- Add `match_reason: string` field to `SoldComp` interface

**Edit: `supabase/functions/ingest-sold-comps/index.ts`**
- For each comp, generate a `match_reason` string explaining why it was included/excluded/broad-matched:
  - "Exact: player + year + brand + card# match"
  - "Broad: player + year match, missing card#"
  - "Excluded: title contains 'lot'"
  - "Low confidence: only player matched"
- Return `match_reason` in the comp response payload

**Edit: `src/components/sports-lab/MarketIntelligencePanel.tsx`**
- Display `match_reason` as a small muted line under each comp in the expanded comps section

### 4. Expanded Parallel Taxonomy

**Edit: `src/lib/cardNormalization.ts`**

Expand `PARALLEL_KEYWORDS` with multi-word parallels and add a priority-ordered matching system:

- Add: `'red ice'`, `'blue ice'`, `'green ice'`, `'sparkle'`, `'laser'`, `'fast break exclusive'`, `'courtside level'`, `'premier level'`, `'concourse level'`, `'club level'`, `'field level'`, `'mezzanine'`
- Change `extractParallel` to match multi-word parallels first (longest match wins), then single-word, then numbered patterns

**Edit: `computeConfidence` in `src/lib/cardNormalization.ts`**
- Increase card_number weight from 2 to 3 so exact card-number matches score much more heavily
- Adjust thresholds: exact >= 7, high >= 5, medium >= 3

Mirror the same parallel + confidence changes in the edge function `ingest-sold-comps/index.ts`.

### 5. Admin Comp Management

**New edge function: `supabase/functions/manage-comps/index.ts`**

A simple admin-only edge function accepting actions:

```json
{ "action": "exclude_comp", "sale_id": "uuid" }
{ "action": "approve_comp", "sale_id": "uuid" }
{ "action": "merge_cards", "source_key": "...", "target_key": "..." }
{ "action": "split_card", "sale_ids": ["..."], "new_key": "..." }
{ "action": "override_metadata", "card_identity_key": "...", "fields": { "brand": "..." } }
```

- Validates admin role via `has_role(auth.uid(), 'admin')`
- `exclude_comp`: updates `sales_history.confidence_score` to `'excluded'`
- `approve_comp`: updates confidence to `'exact'`
- `merge_cards`: reassigns all `sales_history` and `card_market_metrics` from source_key to target_key, deletes source `cards_normalized`
- `split_card`: creates a new `cards_normalized` row with new_key, reassigns specified sale_ids
- `override_metadata`: updates fields on `cards_normalized`
- After any mutation, triggers recompute for affected keys

**Config: `supabase/config.toml`**
- Add `[functions.manage-comps]` with `verify_jwt = false` (auth checked in code)

**New component: `src/components/sports-lab/CompManagementControls.tsx`**

Small inline controls that appear on each comp row in the expanded comps section (only when user is admin). Buttons: Exclude / Approve. Plus a dialog for merge/split/override at the card level.

- Uses `supabase.functions.invoke('manage-comps', ...)` for mutations
- Checks admin status via existing `has_role` RPC
- After mutation, invalidates the in-memory metrics cache and re-fetches

### 6. Database Changes

**Migration**: Add a unique constraint on `sales_history(source, source_sale_id)` if not already present — needed for upsert conflict target.

No new tables needed.

---

### Files to create
- `src/lib/opportunityScore.ts`
- `supabase/functions/manage-comps/index.ts`
- `src/components/sports-lab/CompManagementControls.tsx`

### Files to edit
- `src/components/sports-lab/EbayListingCard.tsx` — add opportunity badge
- `src/components/sports-lab/MarketIntelligencePanel.tsx` — show match_reason + admin controls
- `src/hooks/useCardMarketMetrics.ts` — add match_reason to SoldComp, add cache invalidation helper
- `src/lib/cardNormalization.ts` — expanded parallels, heavier card# weight
- `supabase/functions/ingest-sold-comps/index.ts` — match_reason generation, parallel improvements
- `supabase/config.toml` — add manage-comps function

