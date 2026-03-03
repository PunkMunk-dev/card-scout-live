

# Seed ROI Cards — Fix Approach

## Problem
The `roi-seed` edge function fetches the xlsx file from a URL, but the Lovable preview URL requires authentication, so the fetch returns an HTML login page instead of the xlsx file.

## Solution
Modify the `roi-seed` edge function to accept the parsed data directly as JSON rows in the request body (instead of a URL). Then call it in batches of ~200 rows with the parsed spreadsheet data.

### Changes

**`supabase/functions/roi-seed/index.ts`** — Rewrite to accept `{ rows: [...] }` instead of `{ url: string }`:
- Remove XLSX import entirely (no more file parsing in the function)
- Accept `{ rows: [{ sport, card_name, raw_avg, psa9_avg, psa9_gain, multiplier, psa10_avg, psa10_profit }] }` 
- Accept optional `{ clear: true }` flag on first batch to clear existing data
- Insert the rows directly into `roi_cards`

Then I will call the function multiple times with batches of ~200 rows parsed from the spreadsheet data that I already have access to via the document parser.

### Files Changed
- `supabase/functions/roi-seed/index.ts` — simplified to accept JSON rows directly

### Execution
1. Update the edge function
2. Deploy it
3. Call it ~10 times with batches of 200 rows each (first call with `clear: true`)
4. Verify data count in database

