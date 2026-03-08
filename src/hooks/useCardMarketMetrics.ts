import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeCardTitle } from '@/lib/cardNormalization';

export interface CardMarketMetrics {
  card_identity_key: string;
  raw_median_price: number | null;
  raw_comp_count: number;
  psa10_median_price: number | null;
  psa10_comp_count: number;
  spread_amount: number | null;
  spread_percent: number | null;
  population: number | null;
}

// Simple in-memory cache to avoid refetching
const metricsCache = new Map<string, { data: CardMarketMetrics | null; fetchedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useCardMarketMetrics() {
  const [metrics, setMetrics] = useState<CardMarketMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (
    title: string,
    context?: { playerName?: string; brand?: string; year?: string }
  ) => {
    const normalized = normalizeCardTitle(title, context);
    const key = normalized.card_identity_key;

    // Check cache
    const cached = metricsCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      setMetrics(cached.data);
      return cached.data;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First try to get from the database
      const { data, error: dbError } = await supabase
        .from('card_market_metrics')
        .select('*')
        .eq('card_identity_key', key)
        .maybeSingle();

      if (data && !dbError) {
        const result: CardMarketMetrics = {
          card_identity_key: data.card_identity_key,
          raw_median_price: data.raw_median_price,
          raw_comp_count: data.raw_comp_count ?? 0,
          psa10_median_price: data.psa10_median_price,
          psa10_comp_count: data.psa10_comp_count ?? 0,
          spread_amount: data.spread_amount,
          spread_percent: data.spread_percent,
          population: data.population,
        };
        metricsCache.set(key, { data: result, fetchedAt: Date.now() });
        setMetrics(result);
        setIsLoading(false);
        return result;
      }

      // If not in DB, trigger on-demand ingestion
      const { data: ingestData, error: ingestError } = await supabase.functions.invoke('ingest-sold-comps', {
        body: {
          playerName: context?.playerName || normalized.player_name,
          brand: context?.brand || normalized.brand,
          year: context?.year || normalized.year,
        },
      });

      if (ingestError) throw ingestError;

      // Find the matching metrics from the response
      const matchingMetrics = ingestData?.metrics?.find(
        (m: any) => m.card_identity_key === key
      );

      if (matchingMetrics) {
        const result: CardMarketMetrics = {
          card_identity_key: matchingMetrics.card_identity_key,
          raw_median_price: matchingMetrics.raw_median_price,
          raw_comp_count: matchingMetrics.raw_comp_count ?? 0,
          psa10_median_price: matchingMetrics.psa10_median_price,
          psa10_comp_count: matchingMetrics.psa10_comp_count ?? 0,
          spread_amount: matchingMetrics.spread_amount,
          spread_percent: matchingMetrics.spread_percent,
          population: matchingMetrics.population,
        };
        metricsCache.set(key, { data: result, fetchedAt: Date.now() });
        setMetrics(result);
        setIsLoading(false);
        return result;
      }

      // No data available
      metricsCache.set(key, { data: null, fetchedAt: Date.now() });
      setMetrics(null);
      setIsLoading(false);
      return null;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      setIsLoading(false);
      return null;
    }
  }, []);

  return { metrics, isLoading, error, fetchMetrics };
}
