

# Plan: Add Total Population Extraction for Gem Rate Calculation

## Overview

Enhance the population extraction to capture **both PSA 10 count AND total population** from seller listing patterns like "Pop 5/100" or "Population 12 of 150". This enables calculating the **actual gem rate percentage** (PSA 10 / Total × 100) when both values are available.

---

## Current State

The extraction currently only captures the PSA 10 pop count:

```typescript
// Current patterns only extract PSA 10 count
/\bPOP[:\s]*(\d{1,5})\b/i  // Captures "POP 5" → psa10: 5
```

When only PSA 10 count is available:
- `gemRate` is set to `null` (cannot calculate)
- Badge shows "Pop: 5" without a percentage

---

## New Patterns to Support

| Seller Format | Example | Extracted Values |
|---------------|---------|------------------|
| `Pop X/Y` | "Pop 5/100" | psa10: 5, total: 100 |
| `Pop X of Y` | "Pop 5 of 100" | psa10: 5, total: 100 |
| `PSA 10 Pop X/Y` | "PSA 10 Pop 3/50" | psa10: 3, total: 50 |
| `Population X/Y` | "Population 8/200" | psa10: 8, total: 200 |
| `Pop Count X/Y` | "Pop Count 12/150" | psa10: 12, total: 150 |
| `PSA Pop X (Y total)` | "PSA Pop 5 (120 total)" | psa10: 5, total: 120 |

---

## Phase 1: Update Edge Function Extraction

**File:** `supabase/functions/ebay-search/index.ts`

Update `extractPopulationFromListing` to capture both values:

```typescript
function extractPopulationFromListing(
  title: string, 
  shortDescription?: string
): { psa10: number | null; total: number | null } | null {
  const text = `${title} ${shortDescription || ''}`;
  
  // PRIORITY 1: Patterns that capture BOTH psa10 and total (most specific first)
  const twoValuePatterns = [
    // "Pop 5/100" or "Pop: 5/100" or "POP 5 / 100"
    /\bPOP[:\s]*(\d{1,5})\s*[\/]\s*(\d{1,6})\b/i,
    // "Pop 5 of 100" or "POP 5 OF 100"
    /\bPOP[:\s]*(\d{1,5})\s+of\s+(\d{1,6})\b/i,
    // "PSA 10 Pop 5/100" or "PSA10 Pop: 3/50"
    /PSA\s*10\s+Pop[:\s]*(\d{1,5})\s*[\/]\s*(\d{1,6})/i,
    // "PSA 10 Pop 5 of 100"
    /PSA\s*10\s+Pop[:\s]*(\d{1,5})\s+of\s+(\d{1,6})/i,
    // "Population 5/100" or "Population: 8/200"
    /Population[:\s]*(\d{1,5})\s*[\/]\s*(\d{1,6})/i,
    // "Population 5 of 100"
    /Population[:\s]*(\d{1,5})\s+of\s+(\d{1,6})/i,
    // "Pop Count 5/100" or "Pop Count: 12/150"
    /Pop\s+Count[:\s]*(\d{1,5})\s*[\/]\s*(\d{1,6})/i,
    // "Pop 5 (100 total)" or "POP 5 (100 Total)"
    /\bPOP[:\s]*(\d{1,5})\s*\(\s*(\d{1,6})\s*total\s*\)/i,
    // "PSA Pop 5 (120 total)"
    /PSA\s+Pop[:\s]*(\d{1,5})\s*\(\s*(\d{1,6})\s*total\s*\)/i,
  ];

  // Try two-value patterns first
  for (const pattern of twoValuePatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[2]) {
      const psa10 = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      // Sanity checks
      if (psa10 > 0 && psa10 < 50000 && total > 0 && total < 500000 && psa10 <= total) {
        return { psa10, total };
      }
    }
  }
  
  // PRIORITY 2: Single-value patterns (existing logic)
  const singleValuePatterns = [
    /PSA\s*10\s+Pop[:\s]*(\d{1,5})/i,
    /Pop\s+Count[:\s]*(\d{1,5})/i,
    /Low\s+Pop[:\s]*(\d{1,5})/i,
    /Population[:\s]*(\d{1,5})/i,
    /\bPOP[:\s]*(\d{1,5})\b/i,
  ];

  for (const pattern of singleValuePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const count = parseInt(match[1], 10);
      if (count > 0 && count < 50000) {
        return { psa10: count, total: null };
      }
    }
  }

  return null;
}
```

---

## Phase 2: Calculate Gem Rate When Total Available

**File:** `supabase/functions/ebay-search/index.ts`

Update `normalizeItem` to calculate gem rate when both values exist:

```typescript
// In normalizeItem function, update the popData assignment:

let popData: EbayItem['popData'] = undefined;
if (popExtracted && popExtracted.psa10 !== null) {
  // Calculate gem rate if we have both values
  let gemRate: number | null = null;
  if (popExtracted.total !== null && popExtracted.total > 0) {
    gemRate = Math.round((popExtracted.psa10 / popExtracted.total) * 100);
  }
  
  popData = {
    psa10: popExtracted.psa10,
    total: popExtracted.total,
    gemRate: gemRate,
    source: 'listing' as const,
  };
}
```

---

## Phase 3: Update Type Definitions

**File:** `src/types/gemScore.ts`

Add `totalCount` field to track total graded:

```typescript
export interface GemRateResult {
  // ... existing fields ...
  
  // Real data from listing
  isRealData?: boolean;
  psa10Count?: number;
  totalCount?: number;  // NEW: Total graded cards
}
```

---

## Phase 4: Update useGemRates Hook

**File:** `src/hooks/useGemRates.ts`

Update the real data handling to use calculated gem rate:

```typescript
// In rateItem callback, update the popData handling:

if (item.popData?.psa10 !== null && item.popData?.psa10 !== undefined) {
  ratedIds.current.add(item.itemId);
  const psa10Count = item.popData.psa10;
  const totalCount = item.popData.total;
  const gemRate = item.popData.gemRate;
  
  // Calculate likelihood based on gem rate if available, otherwise use pop count
  let psa10Likelihood: 'High' | 'Medium' | 'Low';
  if (gemRate !== null) {
    // Use gem rate thresholds
    psa10Likelihood = gemRate >= 45 ? 'High' : gemRate >= 30 ? 'Medium' : 'Low';
  } else {
    // Fallback to pop count rarity
    psa10Likelihood = psa10Count <= 5 ? 'High' : psa10Count <= 20 ? 'Medium' : 'Low';
  }
  
  const result: GemRateResult = {
    listingId: item.itemId,
    gemRate: gemRate,  // Now can be a real percentage!
    psa10Likelihood,
    confidence: 1.0,
    dataPoints: totalCount || psa10Count,
    qcRating: 'good',
    qcNotes: totalCount 
      ? `PSA 10: ${psa10Count} / ${totalCount} total (${gemRate}%)`
      : `PSA 10 Population: ${psa10Count} (from listing)`,
    source: 'eBay Listing',
    matchType: 'exact',
    modifiersApplied: [],
    analysisMethod: 'historical_data',
    isRealData: true,
    psa10Count: psa10Count,
    totalCount: totalCount || undefined,
  };
  
  setGemRates(prev => {
    const next = new Map(prev);
    next.set(item.itemId, { loading: false, result });
    return next;
  });
  return;
}
```

---

## Phase 5: Update UI Components

### GemRateBadge.tsx

Update to show gem rate percentage when available:

```tsx
// In the real data section, check for gemRate:
if (result.isRealData && result.psa10Count !== undefined) {
  // If we have a calculated gem rate, show it like a regular rate
  if (result.gemRate !== null) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-help",
            "backdrop-blur-sm shadow-sm border",
            "text-xs font-medium",
            "hover:brightness-110 transition-all",
            popColors[result.psa10Likelihood],
            className
          )}>
            <Database className="h-3 w-3" />
            <span>Gem: {result.gemRate}%</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-auto p-4">
          <GemRateBreakdown result={result} />
        </PopoverContent>
      </Popover>
    );
  }
  
  // Otherwise show just the pop count (existing behavior)
  // ...
}
```

### GemRateBreakdown.tsx

Update to show the full breakdown:

```tsx
if (result.isRealData && result.psa10Count !== undefined) {
  return (
    <div className="space-y-3 min-w-[240px]">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-blue-500" />
        <div>
          {result.gemRate !== null ? (
            <>
              <div className="font-semibold text-lg">{result.gemRate}% Gem Rate</div>
              <div className="text-xs text-muted-foreground">From eBay Listing</div>
            </>
          ) : (
            <>
              <div className="font-semibold text-lg">PSA 10 Pop: {result.psa10Count}</div>
              <div className="text-xs text-muted-foreground">From eBay Listing</div>
            </>
          )}
        </div>
      </div>
      
      {/* Population breakdown */}
      <div className="pt-2 border-t border-border/50">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">PSA 10:</span>
            <span className="ml-2 font-medium">{result.psa10Count}</span>
          </div>
          {result.totalCount && (
            <div>
              <span className="text-muted-foreground">Total:</span>
              <span className="ml-2 font-medium">{result.totalCount}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Rate visualization if available */}
      {result.gemRate !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Gem Rate</span>
            <span>{result.gemRate}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all",
                result.gemRate >= 45 ? 'bg-green-500' :
                result.gemRate >= 30 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${result.gemRate}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="pt-2 border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          {result.totalCount 
            ? `Population data extracted from listing: ${result.psa10Count} of ${result.totalCount} cards graded PSA 10.`
            : 'PSA 10 count extracted from listing. Lower pop = fewer exist.'
          }
        </p>
      </div>
    </div>
  );
}
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `supabase/functions/ebay-search/index.ts` | Add two-value extraction patterns, calculate gem rate in `normalizeItem` |
| `src/types/gemScore.ts` | Add `totalCount?: number` field |
| `src/hooks/useGemRates.ts` | Use `popData.gemRate` and `popData.total`, update likelihood calculation |
| `src/components/GemRateBadge.tsx` | Show "Gem: X%" when rate available, "Pop: X" when only count |
| `src/components/GemRateBreakdown.tsx` | Show full PSA 10/Total breakdown with rate visualization |

---

## Benefits

1. **Actual gem rates** - Real percentages when sellers include both values
2. **Accurate likelihood** - Uses gem rate thresholds (45%/30%) instead of pop count
3. **Rich breakdown** - Shows PSA 10 count, total, and calculated percentage
4. **Backward compatible** - Still works with single pop counts
5. **No additional API calls** - Uses data already in eBay response

