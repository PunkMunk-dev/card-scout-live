

# Raw → PSA 10 Workflow

## Overview
Add a "Raw → PSA 10" mode to the scanner that scrapes 130point.com for recent PSA 10 sold prices and joins them onto raw eBay listings to compute net profit, ROI, and max buy price.

## Architecture

```text
User searches → eBay raw listings (existing) 
                                    ↓
              normalize card identity from title
                                    ↓
              build "cardName PSA 10" query → Edge Function → Firecrawl scrape 130point
                                    ↓
              parse sold rows → filter bad comps → compute median/avg/count
                                    ↓
              join graded data onto raw listings → compute profit/ROI/maxBuy
                                    ↓
              render in RawToPsaTable with user-configurable inputs
```

## Prerequisites
- **Firecrawl connector** must be linked to the project (existing workspace connection `GemrateScrape` needs linking). This provides the `FIRECRAWL_API_KEY` for the edge function to scrape 130point.

## New Files

### 1. `supabase/functions/scrape-130point/index.ts`
Edge function that:
- Accepts `{ query: string }` (e.g. "Charizard 151 PSA 10")
- Uses Firecrawl scrape API to fetch `https://130point.com/sales/?search=<query>` as markdown
- Returns raw markdown/HTML to client for parsing
- Simple CORS + error handling

### 2. `src/lib/scrape130point.ts`
Client module:
- `scrape130point(query: string)` — calls the edge function via `supabase.functions.invoke`
- In-memory cache (Map) keyed by normalized query, expires after 4 hours
- Returns raw scraped content

### 3. `src/lib/parse130pointSales.ts`
Parser module:
- `parse130pointSales(markdown: string)` — extracts sold records from scraped content
- Each record: `{ title, soldPrice, soldDate?, link? }`
- Normalizes whitespace, extracts price as number
- Filters out rows without valid price
- `filterCleanComps(records, rawTitle)` — removes PSA 9, BGS, SGC, CGC, lots, reprints, wrong set/number mismatches
- Returns cleaned `Psa10SoldComp[]`

### 4. `src/lib/normalizeCardIdentity.ts`
- `normalizeCardIdentity(title: string)` → `{ player, year, set, cardNumber, variation, language }`
- Best-effort extraction from eBay title tokens
- Used to build 130point search query and for comp matching
- `buildPsa10Query(identity)` → string for 130point search

### 5. `src/lib/computeRawToPsaMetrics.ts`
Pure functions:
- `computeMetrics(rawPrice, shipping, psa10MedianSold, gradingCost, sellFeePercent, desiredProfit)` returns `{ totalBuyCost, estimatedSellingFee, netProfit, roiPercent, maxBuyPrice }`
- `computeSoldStats(comps)` returns `{ avgSold, medianSold, salesCount }`
- `deriveConfidence(salesCount)` → 'high' | 'medium' | 'low' | 'none'

### 6. `src/hooks/useRawToPsa.ts`
Custom hook:
- Takes current scanner results (raw listings)
- For each unique normalized card identity, fires one 130point scrape (deduped)
- Caches results
- Returns `Map<listingId, Psa10Data>` joined back to listings
- Manages loading/error state per card identity

### 7. `src/components/scanner/RawToPsaView.tsx`
Main view component:
- User inputs at top: Grading Cost ($25 default), Sell Fee % (13% default), Desired Profit ($20 default), Min Sales Count (3), Min ROI % (0%)
- Dense table on desktop, cards on mobile
- Columns: Card, Raw Price, Shipping, Total Buy, PSA 10 Avg, PSA 10 Median, Sales Count, Grading Cost, Sell Fee %, Net Profit, ROI %, Max Buy, Confidence, Open Link
- Color-coded ROI (green positive, red negative)
- Confidence badges (High/Medium/Low/No Data)
- Rows with "No Data" show raw listing info with grayed-out PSA columns
- Sortable by ROI, Net Profit, Price
- Filterable by Min Sales Count and Min ROI

## Modified Files

### 8. `src/components/scanner/StickyScannerHeader.tsx`
- Add a mode toggle in the header: "Scanner" | "Raw → PSA 10"
- Store mode in scanner state or local component state

### 9. `src/pages/Index.tsx`
- When mode is "Raw → PSA 10", render `<RawToPsaView />` instead of `<OpportunityResultsFeed />`
- Keep same sidebar, header, filter bar

### 10. `src/hooks/useScannerState.ts`
- Add `viewMode: 'scanner' | 'rawToPsa'` to state
- Add `SET_VIEW_MODE` action

## Data Flow Detail

1. User switches to "Raw → PSA 10" mode
2. User searches (same eBay search as scanner, but forced `sort: 'raw'` to exclude graded)
3. Results render in table
4. For each unique card identity derived from titles, `useRawToPsa` batches a 130point scrape
5. Scrape results are parsed, comps filtered, stats computed
6. Metrics (profit, ROI, max buy) computed per listing using user inputs
7. Table updates as PSA data arrives (progressive loading per card group)

## 130point Scraping Strategy
- URL pattern: `https://130point.com/sales/?search=charizard+151+psa+10`
- Scrape as markdown via Firecrawl
- Parse table rows from the markdown (130point renders a simple HTML table of recent sales)
- Extract: title text, sold price, sold date
- Cache by normalized query key for 4 hours in-memory (edge function level not needed — client cache is sufficient)

## Formulas (implemented in `computeRawToPsaMetrics.ts`)
```
totalBuyCost = rawPrice + shipping
estimatedSellingFee = psa10MedianSold × (sellFeePercent / 100)
netProfit = psa10MedianSold − totalBuyCost − gradingCost − estimatedSellingFee
roiPercent = (netProfit / totalBuyCost) × 100
maxBuyPrice = psa10MedianSold − desiredProfit − gradingCost − estimatedSellingFee
```

## Confidence
- High: ≥5 clean comps
- Medium: 3–4 clean comps
- Low: 1–2 clean comps
- No Data: 0 clean comps

## Fallbacks
- If Firecrawl fails or 130point returns no parseable data → show "No graded sales found" per card
- Raw listing data always visible regardless of PSA data availability
- If connector not linked → show message asking user to enable Firecrawl

