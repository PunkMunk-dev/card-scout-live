

# Fix Character Name Fragmentation in Grouping Pipeline

## Problem
The grouping produces fragmented rows because the `normalized_card_key` includes the character name, and the character parser matches different name variants for the same person:
- `"Monkey D. Luffy"` vs `"Luffy"` → two separate keys for OP01-001
- `"Roronoa Zoro"` vs `"Zoro"` → two separate keys for ST21-014

Each fragment has only 1 raw sale, failing the min Raw≥2 filter. Only Shanks (consistent name) shows up.

## Secondary Issue
The eBay Finding API (`svcs.ebay.com/services/search/FindingService/v1`) is returning HTTP 500 errors for all queries — this affects `onepiece-ingest`, `sports-ebay-sold-psa`, and `tcg-ebay-search` equally. This is an eBay-side issue, not a code bug. The fetch action code is correct and will work once the API recovers. No code change needed for this.

## Fix (1 file)

### `supabase/functions/onepiece-ingest/index.ts`

**Change 1: Add character alias normalization map** (after line 62, replacing lines 63-87)

Add a `CHARACTER_ALIASES` map that normalizes short names to canonical full names:
- `"luffy"` → `"Monkey D. Luffy"`
- `"zoro"` → `"Roronoa Zoro"`
- `"robin"` → `"Nico Robin"`
- `"ace"` / `"portgas"` → `"Portgas D. Ace"`
- `"law"` / `"trafalgar"` → `"Trafalgar Law"`
- `"hancock"` → `"Boa Hancock"`
- `"kid"` / `"eustass"` → `"Eustass Kid"`
- `"whitebeard"` / `"newgate"` → `"Edward Newgate"`
- `"blackbeard"` / `"teach"` → `"Marshall D. Teach"`
- `"roger"` → `"Gol D. Roger"`

Update `parseCharacter()` to lowercase the match and look up the alias map before returning.

**Change 2: Remove character from normalized key**

In `buildNormalizedCardKey`, remove the character segment from the key. The key becomes:
```
onepiece|{card_number}|{set_name}|{language}|{variant}
```

This prevents character name variants from fragmenting groups. Card number is the primary identity anchor as specified in the original requirements.

**Change 3: Update grouping to pick best character name**

In the `group` action, when building the upsert row, pick the most common `parsed_character` from the grouped listings instead of just using `listings[0].parsed_character`. This ensures the canonical name is stored.

## Result After Fix
- Seed → 10 listings with consistent normalized keys
- Group → 3 rows (Luffy, Shanks, Zoro) all meeting Raw≥2 + PSA≥1
- Table shows all 3 cards with correct metrics

