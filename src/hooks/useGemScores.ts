import { useState, useCallback, useRef, useEffect } from 'react';
import { getGemScore, isGemScoreConfigured, shouldSkipListing } from '@/services/ximilarGemScore';
import type { EbayItem } from '@/types/ebay';
import type { GemScoreResult, GemScoreState } from '@/types/gemScore';

interface UseGemScoresOptions {
  enabled: boolean;
  items: EbayItem[];
  visibleCount?: number;
}

interface UseGemScoresReturn {
  gemScores: Map<string, GemScoreState>;
  isConfigured: boolean;
  scoreVisibleItems: () => void;
}

export function useGemScores({ 
  enabled, 
  items, 
  visibleCount = 12 
}: UseGemScoresOptions): UseGemScoresReturn {
  const [gemScores, setGemScores] = useState<Map<string, GemScoreState>>(new Map());
  const scoredIds = useRef<Set<string>>(new Set());
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const isConfigured = isGemScoreConfigured();
  
  // Score a single item
  const scoreItem = useCallback(async (item: EbayItem) => {
    if (!item.imageUrl) return;
    if (scoredIds.current.has(item.itemId)) return;
    if (shouldSkipListing(item.title)) {
      // Mark as scored but with null result
      scoredIds.current.add(item.itemId);
      setGemScores(prev => {
        const next = new Map(prev);
        next.set(item.itemId, { 
          loading: false, 
          result: {
            listingId: item.itemId,
            gemScore: null,
            psa10Likelihood: 'Low',
            confidence: 0,
            subgrades: null,
            error: 'Not a single card'
          }
        });
        return next;
      });
      return;
    }
    
    // Mark as being scored
    scoredIds.current.add(item.itemId);
    
    // Set loading state
    setGemScores(prev => {
      const next = new Map(prev);
      next.set(item.itemId, { loading: true, result: null });
      return next;
    });
    
    try {
      const result = await getGemScore({
        listingId: item.itemId,
        imageUrl: item.imageUrl,
        title: item.title
      });
      
      setGemScores(prev => {
        const next = new Map(prev);
        next.set(item.itemId, { loading: false, result });
        return next;
      });
    } catch (error) {
      setGemScores(prev => {
        const next = new Map(prev);
        next.set(item.itemId, { 
          loading: false, 
          result: {
            listingId: item.itemId,
            gemScore: null,
            psa10Likelihood: 'Low',
            confidence: 0,
            subgrades: null,
            error: 'Failed to score'
          }
        });
        return next;
      });
    }
  }, []);
  
  // Score visible items with debounce
  const scoreVisibleItems = useCallback(() => {
    if (!enabled || !isConfigured) return;
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      // Get items to score (first N that haven't been scored yet)
      const itemsToScore = items
        .slice(0, visibleCount)
        .filter(item => 
          item.imageUrl && 
          !scoredIds.current.has(item.itemId)
        );
      
      // Score items sequentially to avoid API rate limiting
      itemsToScore.forEach((item, index) => {
        setTimeout(() => scoreItem(item), index * 200);
      });
    }, 300);
  }, [enabled, isConfigured, items, visibleCount, scoreItem]);
  
  // Auto-score when enabled or items change
  useEffect(() => {
    if (enabled && isConfigured && items.length > 0) {
      scoreVisibleItems();
    }
  }, [enabled, isConfigured, items, scoreVisibleItems]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);
  
  // Reset scored IDs when items change completely
  useEffect(() => {
    const currentIds = new Set(items.map(i => i.itemId));
    scoredIds.current = new Set(
      [...scoredIds.current].filter(id => currentIds.has(id))
    );
  }, [items]);
  
  return {
    gemScores,
    isConfigured,
    scoreVisibleItems
  };
}
