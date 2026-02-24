

# Fix: Show More Cards in Sports Lab

## Root Causes

Three issues are causing fewer cards to display than expected:

### 1. Hardcoded $10 minimum price filter
Every listing under $10 is hidden, even when "All Prices" is selected. The "All Prices" option itself has a `min: 10` setting, so there's no way for users to see cheaper cards. Many legitimate listings (base cards, low-value parallels) are $1-$9 and are being silently removed.

### 2. Auctions hidden by default
When "Auctions" toggle is off, ALL auction listings are removed. Many cards are listed as auction-only, so they disappear entirely. Users should see both Buy It Now AND auction cards by default.

### 3. Load-all stops too early
The auto-loader stops after fetching 200 filtered cards or 10 pages. With the aggressive price and auction filters removing so many results, users end up seeing far fewer cards than are actually available.

## Changes

### File: `src/components/sports-lab/EbayResultsPanel.tsx`

1. **Remove the hardcoded $10 minimum** from the base filter -- only apply price minimums when a specific price range is selected
2. **Change "All Prices" range** to `min: 0` so it truly shows all prices
3. **Stop hiding auctions by default** -- show all listings (BIN + Auction) together. The "Auctions" toggle becomes "Auctions Only" to filter down to just auctions when desired
4. **Add a "Buy It Now" toggle** so users can filter to BIN-only if they want, but default is showing everything

### File: `src/hooks/useSportsEbaySearch.ts`

5. **Increase `MAX_LOAD_ALL_PAGES`** from 10 to 20, allowing more results to be fetched automatically

## Expected Impact

- Cards under $10 will now appear (significant increase in visible results)
- Auction listings will appear alongside Buy It Now listings by default
- More pages will load automatically, showing 2x more total results

