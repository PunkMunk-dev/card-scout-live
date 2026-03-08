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
  last_verified_at: string | null;
}

export interface PsaPopulationData {
  total_population: number;
  psa10_population: number | null;
  grades: { psa_grade: string; population_count: number }[];
  last_synced: string | null;
}

export type PsaSyncStatus = 'cached' | 'pending_sync' | 'sync_failed' | 'unavailable';

interface CacheEntry {
  certData: PsaCertData[] | null;
  populationData: PsaPopulationData | null;
  syncStatus: PsaSyncStatus;
  ts: number;
}

const psaCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

export function usePsaCertData() {
  const [certData, setCertData] = useState<PsaCertData[] | null>(null);
  const [populationData, setPopulationData] = useState<PsaPopulationData | null>(null);
  const [syncStatus, setSyncStatus] = useState<PsaSyncStatus>('unavailable');
  const [isLoading, setIsLoading] = useState(false);
  const fetchingRef = useRef<string | null>(null);

  const fetchPsaData = useCallback(async (cardIdentityKey: string) => {
    if (!cardIdentityKey) return;
    if (fetchingRef.current === cardIdentityKey) return;

    const cached = psaCache.get(cardIdentityKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setCertData(cached.certData);
      setPopulationData(cached.populationData);
      setSyncStatus(cached.syncStatus);
      return;
    }

    fetchingRef.current = cardIdentityKey;
    setIsLoading(true);

    try {
      const { data: certs } = await supabase
        .from('psa_cert_cache')
        .select('cert_number, grade, player_name, year, set_name, card_number, image_url, last_verified_at')
        .eq('card_identity_key', cardIdentityKey)
        .order('last_verified_at', { ascending: false });

      const certResult = certs && certs.length > 0 ? certs as PsaCertData[] : null;

      const { data: popRows } = await supabase
        .from('psa_population')
        .select('psa_grade, population_count, last_synced')
        .eq('card_identity_key', cardIdentityKey);

      let popResult: PsaPopulationData | null = null;
      let status: PsaSyncStatus = 'unavailable';

      if (popRows && popRows.length > 0) {
        const total = popRows.reduce((sum, r) => sum + (r.population_count ?? 0), 0);
        const psa10 = popRows.find(r => r.psa_grade === '10');
        const lastSynced = popRows.reduce((latest: string | null, r) => {
          if (!r.last_synced) return latest;
          if (!latest) return r.last_synced;
          return r.last_synced > latest ? r.last_synced : latest;
        }, null);

        popResult = {
          total_population: total,
          psa10_population: psa10?.population_count ?? null,
          grades: popRows.map(r => ({ psa_grade: r.psa_grade || '', population_count: r.population_count ?? 0 })),
          last_synced: lastSynced,
        };
        status = 'cached';
      } else {
        const { data: mapping } = await supabase
          .from('psa_population_mapping')
          .select('last_synced_at, mapping_confidence')
          .eq('card_identity_key', cardIdentityKey)
          .maybeSingle();

        if (mapping) {
          const { data: recentRuns } = await supabase
            .from('psa_sync_runs')
            .select('status')
            .order('created_at', { ascending: false })
            .limit(1);

          const lastRun = recentRuns?.[0];
          if (mapping.last_synced_at && lastRun?.status === 'failed') {
            status = 'sync_failed';
          } else {
            status = 'pending_sync';
          }
        }
      }

      setCertData(certResult);
      setPopulationData(popResult);
      setSyncStatus(status);

      psaCache.set(cardIdentityKey, { certData: certResult, populationData: popResult, syncStatus: status, ts: Date.now() });
    } catch {
      // Silent fail — PSA is enrichment only
    } finally {
      setIsLoading(false);
      fetchingRef.current = null;
    }
  }, []);

  return { certData, populationData, syncStatus, isLoading, fetchPsaData };
}
