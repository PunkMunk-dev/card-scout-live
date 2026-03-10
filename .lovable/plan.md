

# Raw → PSA 10 Tab — Default Values Update

## Current State
The Raw → PSA 10 workflow is **already fully implemented** with all requested components:
- Mode toggle in header (Scanner / Raw → PSA 10)
- Edge function `scrape-130point` using Firecrawl
- Card identity normalization, 130point parsing, bad comp filtering
- Metrics computation (net profit, ROI, max buy price)
- Compact table with confidence badges, color-coded profit/ROI
- Mobile card layout
- 4-hour client-side cache
- Graceful fallbacks for missing data

## Only Change Needed
The default values in `RawToPsaView.tsx` don't match your specifications:

| Input | Current | Requested |
|-------|---------|-----------|
| Grading Cost | $25 | **$150** |
| Desired Profit | $20 | **$300** |
| Min Sales Count | 3 | **2** |
| Min ROI % | 0 | **50** |
| Sell Fee % | 13 | 13 (matches) |

## File Change
**`src/components/scanner/RawToPsaView.tsx`** — Update 4 default values on lines 10–14:
- `gradingCost`: 25 → 150
- `desiredProfit`: 20 → 300
- `minSales`: 3 → 2
- `minRoi`: 0 → 50

No other files need changes. Everything else — the tab, the scraper, the parser, the metrics engine, the UI — is already built and wired.

