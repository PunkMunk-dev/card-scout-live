
# Plan: Integrate eBay Pop Data into Gem Rate Calculation

## Overview

When a listing has `popData` extracted from the eBay title/description (e.g., "PSA 10 Pop 5"), use that real population number directly in the gem rate display instead of making an API call for estimated data.

---

## Current Flow (What Happens Now)

```text
eBay Search → popData extracted → Displayed as separate "Pop: X" badge
                                → Gem Rate still calls edge function for ESTIMATE
```

The pop data is shown but ignored for the gem rate calculation.

---

## New Flow (After Integration)

```text
eBay Search → popData extracted → IF popData available:
                                     → Calculate gem rate CLIENT-SIDE (no API call)
                                     → Show "Pop: X | Real Data" in gem badge
                                  → ELSE:
                                     → Call edge function for estimate (existing flow)
```

---

## Phase 1: Update Types for Real Data Indicator

**File:** `src/types/gemScore.ts`

Add a new field to indicate when gem rate comes from real listing data:

```typescript
export interface GemRateResult {
  // ... existing fields ...
  
  // NEW: Indicates source of data
  isRealData?: boolean;  // true = from eBay listing popData
  psa10Count?: number;   // Actual PSA 10 count from listing
}
```

---

## Phase 2: Update useGemRates Hook

**File:** `src/hooks/useGemRates.ts`

Modify `rateItem` to check for `popData` before calling the edge function:

```typescript
const rateItem = useCallback(async (item: EbayItem) => {
  if (ratedIds.current.has(item.itemId)) return;
  
  // ... existing skip logic ...
  
  // NEW: If popData is available, use it directly (no API call)
  if (item.popData?.psa10 !== null && item.popData?.psa10 !== undefined) {
    ratedIds.current.add(item.itemId);
    const psa10Count = item.popData.psa10;
    
    // Calculate likelihood based on pop count
    // Low pop (<10) = rare = High interest, but doesn't mean high gem rate
    // We use the count for display, but can't calculate % without total
    const result: GemRateResult = {
      listingId: item.itemId,
      gemRate: null, // Cannot calculate without total graded
      psa10Likelihood: psa10Count <= 5 ? 'High' : psa10Count <= 20 ? 'Medium' : 'Low',
      confidence: 1.0,  // We know this is real data
      dataPoints: psa10Count,
      qcRating: 'good',
      qcNotes: `PSA 10 Population: ${psa10Count} (from listing)`,
      source: 'eBay Listing',
      matchType: 'exact',
      modifiersApplied: [],
      analysisMethod: 'historical_data',
      isRealData: true,
      psa10Count: psa10Count,
    };
    
    setGemRates(prev => {
      const next = new Map(prev);
      next.set(item.itemId, { loading: false, result });
      return next;
    });
    return;
  }
  
  // ... existing edge function call logic ...
}, []);
```

---

## Phase 3: Update GemRateBadge UI

**File:** `src/components/GemRateBadge.tsx`

Display differently when we have real pop data vs estimates:

```tsx
// NEW: Real pop data display
if (result.isRealData && result.psa10Count !== undefined) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-help",
          "backdrop-blur-sm shadow-sm border",
          "text-xs font-medium",
          "hover:brightness-110 transition-all",
          "border-blue-500/30 bg-blue-500/10 text-blue-400",
          className
        )}>
          <Database className="h-3 w-3" />
          <span>Pop: {result.psa10Count}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <GemRateBreakdown result={result} />
      </PopoverContent>
    </Popover>
  );
}
```

---

## Phase 4: Update GemRateBreakdown Component

**File:** `src/components/GemRateBreakdown.tsx`

Add special display for real pop data:

```tsx
// Real pop data from listing
if (result.isRealData && result.psa10Count !== undefined) {
  return (
    <div className="space-y-3 min-w-[240px]">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-blue-500" />
        <div>
          <div className="font-semibold text-lg">
            PSA 10 Pop: {result.psa10Count}
          </div>
          <div className="text-xs text-muted-foreground">From eBay Listing</div>
        </div>
      </div>
      
      <div className="pt-2 border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          This population count was extracted directly from the listing. 
          Lower pop means fewer PSA 10 copies exist.
        </p>
        <div className="mt-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span className="text-green-500">Low Pop (1-5):</span>
            <span>Very rare</span>
          </div>
          <div className="flex justify-between">
            <span className="text-yellow-500">Medium (6-20):</span>
            <span>Uncommon</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">High (20+):</span>
            <span>Common</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 5: Remove Redundant Pop Badge

**File:** `src/components/ListingCard.tsx`

Since the gem rate badge now shows pop data when available, remove the separate "Pop: X" badge to avoid duplication:

```tsx
// REMOVE this section:
// {item.popData?.psa10 && (
//   <Badge variant="outline" ...>Pop: {item.popData.psa10}</Badge>
// )}
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `src/types/gemScore.ts` | Add `isRealData` and `psa10Count` fields |
| `src/hooks/useGemRates.ts` | Check for `popData` before calling edge function |
| `src/components/GemRateBadge.tsx` | Add real data display mode with Database icon |
| `src/components/GemRateBreakdown.tsx` | Add real pop data breakdown section |
| `src/components/ListingCard.tsx` | Remove redundant Pop badge |

---

## Benefits

1. **No API call needed** when pop data is in listing - faster UI
2. **Real data indicator** - users know when data is accurate vs estimated
3. **Unified UI** - single badge shows gem rate or pop data, not both
4. **Zero cost** - uses data already extracted during search
