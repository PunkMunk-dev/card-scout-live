

# Plan: Extract PSA Population Data from eBay Listing Descriptions

## Overview

Add extraction of PSA population data from eBay listing descriptions during search. Sellers often include population data in their listing titles/descriptions (e.g., "POP 5", "PSA 10 Pop 12", "Low Pop!"). This data source is **free** (no Firecrawl credits needed) and available during search.

---

## Phase 1: Update EbayItem Interface

**File:** `src/types/ebay.ts`

Add new optional fields to capture extracted population data:

```typescript
export interface EbayItem {
  itemId: string;
  title: string;
  price: { value: string; currency: string };
  shipping?: { value: string; currency: string };
  condition: string;
  buyingOption: 'AUCTION' | 'FIXED_PRICE' | 'UNKNOWN';
  endDate?: string;
  imageUrl?: string;
  additionalImages?: string[];
  itemUrl?: string;
  seller?: string;
  // NEW: Extracted population data from listing
  popData?: {
    psa10: number | null;
    total: number | null;
    gemRate: number | null;
    source: 'listing';  // Indicates data came from eBay listing
  };
}
```

---

## Phase 2: Add Population Extraction to Edge Function

**File:** `supabase/functions/ebay-search/index.ts`

### 2.1 Add Extraction Function

Create a function to parse population data from title and short description:

```typescript
/**
 * Extract PSA population data from listing title and description
 * Sellers often include: "POP 5", "PSA 10 Pop 12", "Low Pop 3", "Population: 15"
 */
function extractPopulationFromListing(
  title: string, 
  shortDescription?: string
): { psa10: number | null; total: number | null } | null {
  const text = `${title} ${shortDescription || ''}`;
  
  // Patterns sellers commonly use:
  const patterns = [
    // "POP 5" or "Pop: 5" or "Pop 12"
    /\bPOP[:\s]*(\d{1,5})\b/i,
    // "PSA 10 Pop 5" or "PSA10 Pop: 12"
    /PSA\s*10\s+Pop[:\s]*(\d{1,5})/i,
    // "Population: 15" or "Population 8"
    /Population[:\s]*(\d{1,5})/i,
    // "Low Pop 3" or "Low Pop: 5"
    /Low\s+Pop[:\s]*(\d{1,5})/i,
    // "Pop Count: 8" or "Pop Count 12"
    /Pop\s+Count[:\s]*(\d{1,5})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const count = parseInt(match[1], 10);
      if (count > 0 && count < 50000) { // Sanity check
        // This is likely the PSA 10 population
        // We don't have total from listing, so return null for total
        return { psa10: count, total: null };
      }
    }
  }

  return null;
}
```

### 2.2 Update normalizeItem Function

Modify `normalizeItem` to capture `shortDescription` and extract pop data:

```typescript
function normalizeItem(item: any): EbayItem {
  // ... existing code ...

  // NEW: Extract population data from listing
  const popExtracted = extractPopulationFromListing(
    item.title, 
    item.shortDescription
  );
  
  let popData = undefined;
  if (popExtracted && popExtracted.psa10 !== null) {
    popData = {
      psa10: popExtracted.psa10,
      total: popExtracted.total,
      gemRate: null, // Cannot calculate without total
      source: 'listing' as const,
    };
  }

  return {
    itemId: item.itemId,
    title: item.title,
    // ... existing fields ...
    popData, // NEW
  };
}
```

---

## Phase 3: Update Edge Function Interface

**File:** `supabase/functions/ebay-search/index.ts`

Update the internal `EbayItem` interface to match:

```typescript
interface EbayItem {
  itemId: string;
  title: string;
  price: { value: string; currency: string };
  shipping?: { value: string; currency: string };
  condition: string;
  buyingOption: 'AUCTION' | 'FIXED_PRICE' | 'UNKNOWN';
  endDate?: string;
  imageUrl?: string;
  additionalImages?: string[];
  itemUrl?: string;
  seller?: string;
  // NEW
  popData?: {
    psa10: number | null;
    total: number | null;
    gemRate: number | null;
    source: 'listing';
  };
}
```

---

## Phase 4: Display Pop Data in UI (Optional Enhancement)

**File:** `src/components/ListingCard.tsx`

Add a small badge when pop data is extracted from listing:

```tsx
{item.popData?.psa10 && (
  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
    Pop: {item.popData.psa10}
  </Badge>
)}
```

---

## Summary of Changes

| File | Action |
|------|--------|
| `src/types/ebay.ts` | Add `popData` optional field to `EbayItem` interface |
| `supabase/functions/ebay-search/index.ts` | Add `extractPopulationFromListing()` function |
| `supabase/functions/ebay-search/index.ts` | Update `normalizeItem()` to extract and include pop data |
| `src/components/ListingCard.tsx` | Display pop badge when data available |

---

## Benefits

1. **Zero cost** - Uses data already in eBay API response
2. **No rate limits** - No external API calls required  
3. **Real-time** - Data extracted during normal search flow
4. **Non-blocking** - If no pop data found, nothing breaks
5. **Complements Firecrawl** - Provides immediate data while Firecrawl handles deeper lookups

---

## Common Seller Pop Formats Covered

| Format | Example |
|--------|---------|
| `POP X` | "2023 Bowman Chrome POP 5" |
| `Pop: X` | "PSA 10 Pop: 12 Rare!" |
| `PSA 10 Pop X` | "PSA 10 Pop 3 Low Pop!" |
| `Population: X` | "Population: 8 - Rare Card" |
| `Low Pop X` | "Low Pop 4 Investment Grade" |
| `Pop Count: X` | "Pop Count: 15 Gem Mint" |

