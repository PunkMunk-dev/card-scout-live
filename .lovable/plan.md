

# Fix: 130point Scrape Returns Empty Results

## Problem
The `scrape-130point` edge function successfully fetches the 130point.com page, but the returned markdown only contains the **navigation/header/footer** — not the search results table. The page shows `"Loading Search Page"`, meaning the JS-rendered results table never appeared within the `waitFor` window.

This is why every row shows `—` in PSA columns despite many 200 responses — the markdown simply contains no sale data to parse.

## Root Cause
130point.com loads search results asynchronously via JavaScript. Firecrawl's basic `waitFor` parameter just waits a fixed time, but the results table requires client-side JS execution that may take longer or need specific interaction triggers.

## Solution: Use Firecrawl `actions` to wait for the results table

Firecrawl supports a `actions` parameter that can wait for specific DOM elements before scraping. We'll add a `wait` action targeting the results table selector, giving the JS time to fully render.

### Changes

**`supabase/functions/scrape-130point/index.ts`**
- Add Firecrawl `actions` array with a `wait` action for the results table CSS selector (e.g., `#resultsTable`, `.search-results`, or the table element that 130point renders)
- Increase `waitFor` to 12000ms as a fallback
- Add a `screenshot` format alongside `markdown` for debugging (optional, can remove later)

Before implementing, I need to inspect what CSS selector 130point.com uses for its results table, so the plan includes:

1. **Fetch 130point.com directly** to identify the correct DOM selector for the results container
2. **Update the edge function** to use Firecrawl's `actions: [{ type: "wait", selector: "<results-selector>", timeout: 15000 }]` before scraping
3. **Add a concurrency limiter** in `useRawToPsa.ts` — currently all ~30+ unique queries fire simultaneously, causing 503/408 errors from rate limiting. Limit to 3-5 concurrent scrapes with a queue.

### Files to change
- `supabase/functions/scrape-130point/index.ts` — add Firecrawl actions for waiting on results table
- `src/hooks/useRawToPsa.ts` — add concurrency limiter (max 3 parallel scrapes)

### Pre-implementation step
I'll fetch 130point.com's HTML to identify the correct CSS selector for the results table before writing the fix.

