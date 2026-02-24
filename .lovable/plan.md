

# Fix: Sports Lab Search Not Firing

## Problem

When selecting a player in Sports Lab, the UI shows loading skeletons forever. The `supabase.functions.invoke('sports-ebay-search')` call never produces a network request, even though:
- The edge function works perfectly when called directly (returns 72 listings for "Saquon Barkley")
- Other Supabase client operations (RPC calls, table queries) work fine
- CORS headers are correctly configured

## Root Cause

The Supabase JS client's `functions.invoke` method appears to silently hang in this environment. This affects all sports edge function calls (`sports-ebay-search`, `sports-ebay-sold-psa`).

## Solution

Replace `supabase.functions.invoke` with direct `fetch` calls in `useSportsEbaySearch.ts`. The edge functions have `verify_jwt = false` and proper CORS headers, so direct fetch works without auth.

### Changes

**`src/hooks/useSportsEbaySearch.ts`**

Create a small helper function that builds the edge function URL from env vars and makes a direct `fetch` POST:

```text
const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function invokeEdgeFunction<T>(name: string, body: object): Promise<T> {
  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Edge function error: ${res.status}`);
  return res.json();
}
```

Then replace all 4 occurrences of `supabase.functions.invoke` in the file with `invokeEdgeFunction`:
- `search()` function (line 61)
- `loadMore()` function (line 94)
- `loadAll()` function (line 132)
- `fetchPsa10Price()` function (line 163)

Also add `console.log` breadcrumbs at key points (before/after fetch) for future debugging.

### Files Changed

| File | Change |
|---|---|
| `src/hooks/useSportsEbaySearch.ts` | Replace `supabase.functions.invoke` with direct `fetch` calls using helper function |

### No Other Changes Needed

- Edge functions: no changes (CORS already configured)
- Frontend components: no changes
- Types: no changes

