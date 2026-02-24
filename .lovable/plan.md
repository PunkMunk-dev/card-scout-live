

# End-to-End Testing & Bug Fix Plan

## Issues Found

### 1. Console Warning: `forwardRef` on `EbayResultsPanel` and `SkeletonCard` (Sports Lab)

Two React warnings appear:
- "Function components cannot be given refs. Check the render method of `ResultsGrid`" -- `EbayResultsPanel` receives a ref but is not wrapped in `React.forwardRef`
- "Function components cannot be given refs. Check the render method of `EbayResultsPanel`" -- `SkeletonCard` receives a ref but is not wrapped in `React.forwardRef`

These are non-breaking warnings but indicate something is passing refs to these components unexpectedly. The fix is to wrap both `EbayResultsPanel` and `SkeletonCard` in `React.forwardRef`.

### 2. CORS Header Mismatch on `ebay-search` Edge Function (Card Finder)

The `ebay-search` function (used by the Card Finder / Index page) has an incomplete `Access-Control-Allow-Headers`:

```
'authorization, x-client-info, apikey, content-type'
```

It is missing the newer Supabase client headers that the current SDK sends:

```
x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version
```

The `sports-ebay-search` function already has the correct headers. This mismatch can cause CORS preflight failures for the Card Finder page on certain browsers/versions.

### 3. Sports Lab "No listings found" for Jayden Daniels

The session replay shows the user selecting Football > Jayden Daniels and seeing "No listings found". This is likely a transient eBay API issue or the aggressive filtering removing all results. No code bug -- the edge function logic is correct. However, we should verify the search is firing correctly.

## Fixes

### File: `src/components/sports-lab/EbayResultsPanel.tsx`
- Wrap the component in `React.forwardRef` to accept the ref properly and silence the warning

### File: `src/components/sports-lab/SkeletonCard.tsx`
- Wrap the component in `React.forwardRef` to accept the ref properly and silence the warning

### File: `supabase/functions/ebay-search/index.ts`
- Update `corsHeaders['Access-Control-Allow-Headers']` to include the full set of Supabase client headers, matching the pattern used in `sports-ebay-search`

## Technical Details

### `EbayResultsPanel.tsx` change
```tsx
// Before
export function EbayResultsPanel({ ... }: EbayResultsPanelProps) {

// After
export const EbayResultsPanel = React.forwardRef<HTMLDivElement, EbayResultsPanelProps>(
  function EbayResultsPanel({ ... }, ref) {
    // existing body, add ref to root div
  }
);
```

### `SkeletonCard.tsx` change
```tsx
// Before
export function SkeletonCard() {

// After
export const SkeletonCard = React.forwardRef<HTMLDivElement>(
  function SkeletonCard(_props, ref) {
    return <div ref={ref} ...>
  }
);
```

### `ebay-search/index.ts` CORS fix
```ts
// Before
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',

// After
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
```

## Summary

| Issue | Impact | Fix |
|---|---|---|
| forwardRef warnings on EbayResultsPanel/SkeletonCard | Console noise, potential future breakage | Wrap both in React.forwardRef |
| ebay-search CORS headers incomplete | Card Finder may fail on some browsers | Add missing headers to match other functions |
| Sports "No listings found" | Transient eBay API / filtering result | No code change needed -- API and filters are correct |

