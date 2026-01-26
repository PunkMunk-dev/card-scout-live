
# Plan: Lookup Graded Card Population for Raw Listings

## Summary

When searching for raw/ungraded cards, the system will perform a secondary lookup to find graded versions of the same card and extract their population data. This enriches raw listings with real PSA population stats from matching graded listings.

## How It Works

```text
User searches: "Drake Maye Rookie Silver Prizm"
        |
        v
+---------------------------+
|  Main Search (raw cards)  |  <-- Returns ungraded listings
+---------------------------+
        |
        v
+---------------------------+
|  Graded Lookup (async)    |  <-- New: Searches "Drake Maye Silver Prizm PSA 10"
+---------------------------+
        |
        v
+---------------------------+
|  Extract Pop Data         |  <-- Extracts "Pop 5/100" from graded listings
+---------------------------+
        |
        v
+---------------------------+
|  Enrich Raw Listings      |  <-- Applies pop data to matching raw cards
+---------------------------+
```

## Technical Changes

### 1. New Edge Function: `graded-pop-lookup`

Create a new edge function that:
1. Takes a search query (card name/details)
2. Searches eBay for graded versions ("query + PSA 10")
3. Extracts population data from matching graded listings
4. Returns aggregated population data

Location: `supabase/functions/graded-pop-lookup/index.ts`

```typescript
// Core logic pseudocode:
async function lookupGradedPop(query: string) {
  // 1. Build graded search query
  const gradedQuery = `${query} PSA 10`;
  
  // 2. Search for graded cards (limit 10 for efficiency)
  const gradedResults = await searchEbay(token, gradedQuery, 10, 0, 'bestMatch');
  
  // 3. Filter to only PSA 10 graded items
  const psa10Items = gradedResults.filter(item => 
    /\bPSA\s*10\b/i.test(item.title)
  );
  
  // 4. Extract pop data from each listing
  const popDataArray = psa10Items.map(item => 
    extractPopulationFromListing(item.title, item.shortDescription)
  ).filter(Boolean);
  
  // 5. Aggregate (use most common or most detailed pop data)
  return aggregatePopData(popDataArray);
}
```

### 2. Update Client-Side: `useGemRates.ts`

Add secondary lookup when `popData` is not available from the listing:

```typescript
// In useGemRates.ts - rateItem function

// If no popData from listing, try graded lookup
if (!item.popData?.psa10) {
  const gradedPop = await lookupGradedPop(item.title);
  if (gradedPop?.psa10) {
    // Create popData from graded lookup
    popData = {
      psa10: gradedPop.psa10,
      total: gradedPop.total,
      gemRate: gradedPop.total 
        ? Math.round((gradedPop.psa10 / gradedPop.total) * 100) 
        : null,
      source: 'graded_lookup' // New source type
    };
  }
}
```

### 3. Update Type Definitions

Extend the `popData` source type:

```typescript
// In src/types/ebay.ts
popData?: {
  psa10: number | null;
  total: number | null;
  gemRate: number | null;
  source: 'listing' | 'graded_lookup';  // Add new source
};
```

### 4. Update UI Badge

Show different icon for graded lookup vs direct listing data:

```typescript
// In GemRateBadge.tsx
// Use Database icon for 'listing' source (current)
// Use Search icon for 'graded_lookup' source (new)
```

---

## File Changes Summary

| File | Change |
|------|--------|
| `supabase/functions/graded-pop-lookup/index.ts` | **New** - Edge function for graded card lookup |
| `src/hooks/useGemRates.ts` | Add call to graded lookup when popData missing |
| `src/services/gradedPopService.ts` | **New** - Client service for graded pop lookup |
| `src/types/ebay.ts` | Extend popData.source type |
| `src/components/GemRateBadge.tsx` | Show different icon for lookup source |

---

## Performance Considerations

1. **Lazy Loading**: Only trigger graded lookup when user enables "Gem Rate" toggle
2. **Batching**: Lookup multiple cards in parallel (Promise.all)
3. **Caching**: Cache results in memory and optionally in `psa_population_cache` table
4. **Rate Limiting**: Limit to first 12 visible cards to avoid excessive API calls
5. **Query Optimization**: Extract core card identity (player + year + product) for better matching

---

## Query Extraction Logic

To find the right graded card, extract key identifiers from raw listing title:

```typescript
function buildGradedQuery(title: string): string {
  // Parse card metadata
  const metadata = parseCardTitle(title);
  
  // Build focused query
  const parts = [];
  if (metadata.playerName) parts.push(metadata.playerName);
  if (metadata.year) parts.push(metadata.year);
  if (metadata.product) parts.push(metadata.product);
  if (metadata.setName) parts.push(metadata.setName);
  
  return parts.join(' ') + ' PSA 10';
}
```

---

## Expected User Experience

**Before:**
- Raw card listing shows no population data
- Badge shows estimated gem rate based on historical data

**After:**
- Raw card listing shows real population data from graded versions
- Badge shows "Gem: 42%" with Search icon indicating data from graded lookup
- Tooltip explains: "Population data from matching PSA 10 listings"

---

## Example Flow

1. User searches "Drake Maye Silver Prizm" (raw cards)
2. System returns 24 ungraded listings (no popData)
3. User enables "Gem Rate" toggle
4. For each visible card:
   - System calls `graded-pop-lookup` with query "Drake Maye 2024 Prizm Silver PSA 10"
   - Finds graded listing with "PSA 10 Pop 4, Total Pop 6"
   - Extracts `psa10: 4, total: 6, gemRate: 67`
5. Raw listing now shows "Gem: 67%" badge with Search icon
