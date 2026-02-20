
# Clean Up Sort Options

A simple cleanup across 4 files. The user also wants to rename "Raw Cards" to "Ungraded".

## Changes

### 1. `src/components/SearchFilters.tsx`
- `"Auction Only"` → `"Auction"` (value stays `auction_only`)
- `"Buy It Now Only"` → `"Buy It Now"` (value stays `buy_now_only`)
- `"Raw Cards"` → `"Ungraded"` (value stays `raw`)
- Remove the `"Ending Soon"` `<SelectItem>` (value `end_soonest`)

Final dropdown order:
- Best Match
- Price: Low-High
- Auction
- Buy It Now
- Ungraded

### 2. `src/types/ebay.ts`
- Remove `'end_soonest'` from the `SortOption` union type

### 3. `src/pages/Index.tsx`
- Remove the `if (sort === 'end_soonest') return 'AUCTION';` line from `deriveBuyingOptions`

### 4. `supabase/functions/ebay-search/index.ts`
- Remove `'end_soonest'` from the `SearchRequest` sort type on line 12
- Remove the `case 'end_soonest': return 'endingSoonest';` from `getSortParam` (lines 204–205)
- Update line 445: remove `|| sort === 'end_soonest'` from the condition that shows all cards
- Update line 448: remove the `end_soonest` reference in the comment on line 448 (`// Default (best, end_soonest): show only raw...` → `// Default (best): show only raw...`)
- Redeploy the edge function

## No functional changes — labels and dead code only.
