import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PsaCertData {
  cert_number: string;
  grade: string | null;
  player_name: string | null;
  year: string | null;
  set_name: string | null;
  card_number: string | null;
  image_url: string | null;
  last_verified_at: string;
}

export interface PsaPopulationData {
  total_population: number;
  grade_breakdown: { grade: string; count: number }[];
  mapping_confidence: string;
  is_admin_verified: boolean;
}

interface CacheEntry {
  certData: PsaCertData[] | null;
  populationData: PsaPopulationData | null;
  ts: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export function usePsaCertData() {
  const [certData, setCertData] = useState<PsaCertData[] | null>(null);
  const [populationData, setPopulationData] = useState<PsaPopulationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchingRef = useRef(false);

  const fetchPsaData = useCallback(async (cardIdentityKey: string) => {
    if (!cardIdentityKey || fetchingRef.current) return;

    const cached = cache.get(cardIdentityKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setCertData(cached.certData);
      setPopulationData(cached.populationData);
      return;
    }

    fetchingRef.current = true;
    setIsLoading(true);

    try {
      // Fetch cert data from cache table
      const { data: certs } = await supabase
        .from('psa_cert_cache')
        .select('cert_number, grade, player_name, year, set_name, card_number, image_url, last_verified_at')
        .eq('card_identity_key', cardIdentityKey);

      const certResult = certs && certs.length > 0 ? certs as PsaCertData[] : null;

      // Fetch population mapping
      const { data: mapping } = await supabase
        .from('psa_population_mapping')
        .select('mapping_confidence, is_admin_verified')
        .eq('card_identity_key', cardIdentityKey)
        .single();

      let popResult: PsaPopulationData | null = null;

      if (mapping) {
        const { data: popRows } = await supabase
          .from('psa_population')
          .select('psa_grade, population_count')
          .eq('card_identity_key', cardIdentityKey);

        if (popRows && popRows.length > 0) {
          popResult = {
            total_population: popRows.reduce((s, r) => s + (r.population_count ?? 0), 0),
            grade_breakdown: popRows.map(r => ({ grade: r.psa_grade ?? '?', count: r.population_count ?? 0 })),
            mapping_confidence: mapping.mapping_confidence ?? 'unverified',
            is_admin_verified: mapping.is_admin_verified ?? false,
          };
        }
      }

      cache.set(cardIdentityKey, { certData: certResult, populationData: popResult, ts: Date.now() });
      setCertData(certResult);
      setPopulationData(popResult);
    } catch {
      // Silent fail — PSA data is enrichment only
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  return { certData, populationData, isLoading, fetchPsaData };
}
