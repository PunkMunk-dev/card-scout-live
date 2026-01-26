import { useState, useCallback, useRef, useEffect } from 'react';
import { getGemRate, isGemRateConfigured, shouldSkipListing } from '@/services/gemRateService';
import type { EbayItem } from '@/types/ebay';
import type { GemRateResult, GemRateState } from '@/types/gemScore';

interface UseGemRatesOptions {
  enabled: boolean;
  items: EbayItem[];
  visibleCount?: number;
}

interface UseGemRatesReturn {
  gemRates: Map<string, GemRateState>;
  isConfigured: boolean;
  rateVisibleItems: () => void;
}

export function useGemRates({ 
  enabled, 
  items, 
  visibleCount = 12 
}: UseGemRatesOptions): UseGemRatesReturn {
  const [gemRates, setGemRates] = useState<Map<string, GemRateState>>(new Map());
  const ratedIds = useRef<Set<string>>(new Set());
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const isConfigured = isGemRateConfigured();
  
  // Rate a single item
  const rateItem = useCallback(async (item: EbayItem) => {
    if (ratedIds.current.has(item.itemId)) return;
    if (shouldSkipListing(item.title)) {
      // Mark as rated but with null result
      ratedIds.current.add(item.itemId);
      setGemRates(prev => {
        const next = new Map(prev);
        next.set(item.itemId, { 
          loading: false, 
          result: {
            listingId: item.itemId,
            gemRate: null,
            psa10Likelihood: 'Low',
            confidence: 0,
            dataPoints: 0,
            qcRating: 'average',
            qcNotes: '',
            source: '',
            matchType: 'default',
            modifiersApplied: [],
            analysisMethod: 'failed',
            error: 'Not a single card'
          }
        });
        return next;
      });
      return;
    }
    
    // NEW: If popData is available from listing, use it directly (no API call)
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
    
    // Mark as being rated
    ratedIds.current.add(item.itemId);
    
    // Set loading state
    setGemRates(prev => {
      const next = new Map(prev);
      next.set(item.itemId, { loading: true, result: null });
      return next;
    });
    
    try {
      const result = await getGemRate({
        listingId: item.itemId,
        title: item.title
      });
      
      setGemRates(prev => {
        const next = new Map(prev);
        next.set(item.itemId, { loading: false, result });
        return next;
      });
    } catch (error) {
      setGemRates(prev => {
        const next = new Map(prev);
        next.set(item.itemId, { 
          loading: false, 
          result: {
            listingId: item.itemId,
            gemRate: null,
            psa10Likelihood: 'Low',
            confidence: 0,
            dataPoints: 0,
            qcRating: 'average',
            qcNotes: '',
            source: '',
            matchType: 'default',
            modifiersApplied: [],
            analysisMethod: 'failed',
            error: 'Failed to get rate'
          }
        });
        return next;
      });
    }
  }, []);
  
  // Rate visible items with debounce
  const rateVisibleItems = useCallback(() => {
    if (!enabled || !isConfigured) return;
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      // Get items to rate (first N that haven't been rated yet)
      const itemsToRate = items
        .slice(0, visibleCount)
        .filter(item => !ratedIds.current.has(item.itemId));
      
      // Rate items with small delay between each to avoid overwhelming
      itemsToRate.forEach((item, index) => {
        setTimeout(() => rateItem(item), index * 100);
      });
    }, 200);
  }, [enabled, isConfigured, items, visibleCount, rateItem]);
  
  // Auto-rate when enabled or items change
  useEffect(() => {
    if (enabled && isConfigured && items.length > 0) {
      rateVisibleItems();
    }
  }, [enabled, isConfigured, items, rateVisibleItems]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);
  
  // Reset rated IDs when items change completely
  useEffect(() => {
    const currentIds = new Set(items.map(i => i.itemId));
    ratedIds.current = new Set(
      [...ratedIds.current].filter(id => currentIds.has(id))
    );
  }, [items]);
  
  return {
    gemRates,
    isConfigured,
    rateVisibleItems
  };
}

// Legacy export for backward compatibility
export { useGemRates as useGemScores };
