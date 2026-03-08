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

export interface SoldComp {
  title: string;
  sold_price: number;
  shipping_price?: number;
  total_price: number;
  sold_at: string | null;
  raw_or_graded: string;
  grader?: string | null;
  grade?: string | null;
  confidence_score: string;
  card_identity_key: string;
  url?: string;
  excluded: boolean;
}

// Minimum comp thresholds
export const RAW_THRESHOLD = 3;
export const PSA10_THRESHOLD = 2;

export type ConfidenceLevel = 'full' | 'limited' | 'insufficient';

export function getConfidenceLevel(metrics: CardMarketMetrics | null): ConfidenceLevel {
  if (!metrics) return 'insufficient';
  const hasRaw = metrics.raw_comp_count >= RAW_THRESHOLD && metrics.raw_median_price !== null;
  const hasPsa10 = metrics.psa10_comp_count >= PSA10_THRESHOLD && metrics.psa10_median_price !== null;
  if (hasRaw && hasPsa10) return 'full';
  if (hasRaw || hasPsa10) return 'limited';
  return 'insufficient';
}

// Simple in-memory cache
const metricsCache = new Map<string, { data: CardMarketMetrics | null; comps: SoldComp[]; fetchedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export function useCardMarketMetrics() {
  const [metrics, setMetrics] = useState<CardMarketMetrics | null>(null);
  const [comps, setComps] = useState<SoldComp[]>([]);
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
      setComps(cached.comps);
      return cached.data;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First try DB
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

        // Fetch associated comps from sales_history
        const { data: salesData } = await supabase
          .from('sales_history')
          .select('*')
          .eq('card_identity_key', key)
          .order('sold_at', { ascending: false })
          .limit(50);

        const fetchedComps: SoldComp[] = (salesData || []).map((s: any) => ({
          title: s.title || '',
          sold_price: s.sold_price || 0,
          shipping_price: s.shipping_price || 0,
          total_price: s.total_price || 0,
          sold_at: s.sold_at,
          raw_or_graded: s.raw_or_graded,
          grader: s.grader,
          grade: s.grade,
          confidence_score: s.confidence_score,
          card_identity_key: s.card_identity_key,
          url: s.url,
          excluded: false,
        }));

        metricsCache.set(key, { data: result, comps: fetchedComps, fetchedAt: Date.now() });
        setMetrics(result);
        setComps(fetchedComps);
        setIsLoading(false);
        return result;
      }

      // Trigger on-demand ingestion
      const { data: ingestData, error: ingestError } = await supabase.functions.invoke('ingest-sold-comps', {
        body: {
          playerName: context?.playerName || normalized.player_name,
          brand: context?.brand || normalized.brand,
          year: context?.year || normalized.year,
        },
      });

      if (ingestError) throw ingestError;

      const matchingMetrics = ingestData?.metrics?.find(
        (m: any) => m.card_identity_key === key
      );

      const returnedComps: SoldComp[] = (ingestData?.comps || []).filter(
        (c: any) => c.card_identity_key === key
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
        metricsCache.set(key, { data: result, comps: returnedComps, fetchedAt: Date.now() });
        setMetrics(result);
        setComps(returnedComps);
        setIsLoading(false);
        return result;
      }

      metricsCache.set(key, { data: null, comps: [], fetchedAt: Date.now() });
      setMetrics(null);
      setComps([]);
      setIsLoading(false);
      return null;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      setIsLoading(false);
      return null;
    }
  }, []);

  return { metrics, comps, isLoading, error, fetchMetrics };
}
