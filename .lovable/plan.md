

## Plan: Add Sport Filter to Live Auctions

### What changes

The user wants a sport filter on the `/roi` Live Auctions page so they can view auctions for a specific sport (e.g., "Football", "Basketball") or "TCG" (Pokemon). This is purely a **frontend filter** — the `roi_cards` table already has a `sport` column with values: Baseball, Basketball, Football, Hockey, Pokemon, Soccer.

### 1. Frontend — Add sport filter pills to TopRoi.tsx toolbar

Add a `sportFilter` state (default `'All'`) and render clickable pill buttons in the toolbar:

- **All** | **Sports** (Baseball, Basketball, Football, Hockey, Soccer combined) | **TCG** (Pokemon only)

When a pill is selected, filter the `enriched` list by checking `card.sport`:
- `'All'` → no filter
- `'Sports'` → exclude Pokemon
- `'TCG'` → only Pokemon

### 2. Update enriched filter logic in TopRoi.tsx

In the `enriched` useMemo, after the minProfit filter, add sport filtering based on `sportFilter` state and the `card.sport` field from the joined `RoiCard`.

### 3. Update snapshot state

Add `sportFilter` to the snapshot filters object.

### Files modified

| File | Change |
|------|--------|
| `src/pages/TopRoi.tsx` | Add `sportFilter` state, pill buttons in toolbar, filter in `enriched` memo |

No backend or edge function changes needed — the sport data already exists on `roi_cards` and the scanner already processes all sports.

