

# Top ROI Tab — Full Plan

## Overview
Add a new **Top ROI** tab to the app that displays ~2,010 cards from the analytics spreadsheet, grouped by sport/category, showing PSA 9 and PSA 10 gain data. eBay listings are fetched on-demand per card and cached server-side.

## Data & Storage

### 1. Database table: `roi_cards`
Store all spreadsheet rows in a new table:
```sql
CREATE TABLE public.roi_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport text NOT NULL,           -- Basketball, Football, Baseball, Hockey, Soccer, Pokemon
  card_name text NOT NULL,
  raw_avg numeric,
  psa9_avg numeric,
  psa9_gain numeric,             -- can be negative
  multiplier numeric,
  psa10_avg numeric,
  psa10_profit numeric,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.roi_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read roi_cards" ON public.roi_cards FOR SELECT USING (true);
```
Seed with all ~2,010 rows from the spreadsheet via migration.

### 2. eBay listing cache table: `roi_ebay_cache`
```sql
CREATE TABLE public.roi_ebay_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_name text NOT NULL UNIQUE,
  listings jsonb NOT NULL DEFAULT '[]',
  fetched_at timestamptz DEFAULT now()
);
ALTER TABLE public.roi_ebay_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read roi_ebay_cache" ON public.roi_ebay_cache FOR SELECT USING (true);
```
Cached listings expire after 6 hours (checked at query time).

### 3. Edge function: `roi-ebay-listings`
- Accepts `{ cardName: string }`
- Checks `roi_ebay_cache` — if fresh (<6h), returns cached
- Otherwise calls eBay Browse API (reuses existing OAuth token logic) with a cleaned/truncated query
- Stores results in cache, returns to client
- Returns top 8 listings per card

## Navigation

### 4. Add "Top ROI" tab to `TabNavigation.tsx`
Add to the `tabs` array:
```typescript
const tabs = [
  { to: '/tcg', label: 'TCG Market', shortLabel: 'TCG' },
  { to: '/sports', label: 'Sports Market', shortLabel: 'Sports' },
  { to: '/roi', label: 'Top ROI', shortLabel: 'ROI' },
];
```

### 5. Add route in `App.tsx`
```typescript
const TopRoi = lazy(() => import("./pages/TopRoi"));
// ... in Routes:
<Route path="/roi" element={<ErrorBoundary><TopRoi /></ErrorBoundary>} />
```

## Page & UI

### 6. New page: `src/pages/TopRoi.tsx`
- Header with title "Top ROI Cards" and sport filter pills (All, Basketball, Football, Baseball, Hockey, Soccer, Pokemon)
- Fetches `roi_cards` from the database, filtered by selected sport
- Default sort: by `psa10_profit` descending (highest ROI first)
- Sort options: PSA 10 Profit, PSA 9 Gain, Multiplier, Raw Price
- Search/filter input to find specific cards by name

### 7. Card component: `src/components/roi/RoiCard.tsx`
Follows existing `om-card` styling. Each card shows:
- **Card name** (title, 2-line clamp)
- **Raw Avg** price
- **PSA 9 Avg** + gain/loss badge (green if positive, red if negative)
- **PSA 10 Avg** + profit badge
- **Multiplier** (e.g. "4.93x")
- **"View Listings"** button that expands/opens eBay results for that card

### 8. eBay listings drawer/expand
When user clicks "View Listings" on a ROI card:
- Calls the `roi-ebay-listings` edge function
- Shows a small grid or horizontal scroll of eBay listing cards (reusing existing `TerminalCard` style)
- Loading skeleton while fetching

### 9. Hook: `src/hooks/useRoiCards.ts`
- `useRoiCards(sport?: string)` — fetches from `roi_cards` table via Supabase client
- `useRoiEbayListings(cardName: string)` — calls edge function, returns cached or fresh listings

## Files to Create
- `src/pages/TopRoi.tsx` — main page
- `src/components/roi/RoiCard.tsx` — individual ROI card
- `src/components/roi/RoiHeader.tsx` — header with sport filters
- `src/components/roi/RoiListingsDrawer.tsx` — eBay listings expansion
- `src/hooks/useRoiCards.ts` — data hooks
- `supabase/functions/roi-ebay-listings/index.ts` — edge function for cached eBay search
- DB migration for `roi_cards` + `roi_ebay_cache` tables + seed data

## Files to Modify
- `src/App.tsx` — add route
- `src/components/TabNavigation.tsx` — add tab

## Technical Notes
- The ~2,010 card seed will be split across multiple migration statements if needed due to size
- eBay searches are on-demand (not batch) to avoid API rate limits
- Card names are cleaned before eBay search (strip parentheticals, card numbers, set names) using the same logic from `ebay-search`
- Dollar values from the spreadsheet are parsed by stripping `$`, `,`, and `()` for negatives

