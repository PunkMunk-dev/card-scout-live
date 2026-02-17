
# Fix: Auction Only and Buy It Now Only Still Returning No Results

## Root Cause

The `buyingOptions` filter is only applied **client-side** after fetching results from eBay. The eBay Browse API returns mostly `FIXED_PRICE` items by default for "bestMatch", so when we filter for `AUCTION` client-side, all items get removed.

The fix is to pass the `buyingOptions` filter **to the eBay API itself** using the `filter` query parameter, so eBay returns the correct type of listings from the source.

## Changes

### 1. Update `searchEbay` function signature (`supabase/functions/ebay-search/index.ts`)

Add a `buyingOptions` parameter to the `searchEbay` function and include it as a `filter` param in the API request:

```typescript
async function searchEbay(
  token: string,
  query: string,
  limit: number,
  offset: number,
  sort: string,
  buyingOptions?: 'AUCTION' | 'FIXED_PRICE'
): Promise<{ items: any[]; total: number }>
```

When `buyingOptions` is provided, add `filter=buyingOptions:{AUCTION}` or `filter=buyingOptions:{FIXED_PRICE}` to the URL parameters.

### 2. Pass `buyingOptions` through to the API call

In the main `serve` handler, pass the `buyingOptions` value to `searchEbay()` so the eBay API filters at the source:

```typescript
const { items: rawItems, total } = await searchEbay(
  token, query, requestLimit, offset, sortParam,
  buyingOptions !== 'ALL' ? buyingOptions : undefined
);
```

### 3. Keep client-side filter as a safety net

The existing client-side `buyingOptions` filter at lines 407-410 can remain as a fallback to catch any items that slip through, but the primary filtering will now happen server-side via the eBay API.

### 4. Deploy edge function

Redeploy `ebay-search` after the fix.

## Expected Result

- **Auction Only**: eBay API returns only auction listings, so results will populate correctly
- **Buy It Now Only**: eBay API returns only fixed-price listings
- **Other sort options**: No `filter` param sent, eBay returns all buying formats as before
