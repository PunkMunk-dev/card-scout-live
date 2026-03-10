import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OnepieceMarketRow {
  normalized_card_key: string;
  game: string;
  character: string | null;
  card_number: string | null;
  set_name: string | null;
  rarity: string | null;
  variant: string | null;
  language: string | null;
  raw_avg_price_usd: number | null;
  raw_median_price_usd: number | null;
  raw_sale_count: number;
  raw_prices_usd: string[] | null;
  raw_sold_dates: string[] | null;
  raw_source_urls: string[] | null;
  psa10_avg_price_usd: number | null;
  psa10_median_price_usd: number | null;
  psa10_sale_count: number;
  psa10_prices_usd: string[] | null;
  psa10_sold_dates: string[] | null;
  psa10_source_urls: string[] | null;
  price_spread_usd: number | null;
  multiple: number | null;
  match_confidence: string | null;
  notes: string | null;
  last_updated_at: string;
}

export interface MarketFilters {
  confidenceFilter: 'all' | 'medium_high' | 'high';
  language: string;
  setName: string;
  characterSearch: string;
  cardNumberSearch: string;
  minRawSales: number;
  minPsa10Sales: number;
  dateWindow: number;
}

export function useOnepieceMarket(filters: MarketFilters) {
  return useQuery({
    queryKey: ['onepiece-market', filters],
    queryFn: async () => {
      let q = supabase
        .from('onepiece_card_market')
        .select('*')
        .eq('game', 'onepiece')
        .order('last_updated_at', { ascending: false });

      if (filters.confidenceFilter === 'high') {
        q = q.eq('match_confidence', 'high');
      } else if (filters.confidenceFilter === 'medium_high') {
        q = q.in('match_confidence', ['high', 'medium']);
      }

      if (filters.language) {
        q = q.eq('language', filters.language);
      }
      if (filters.setName) {
        q = q.ilike('set_name', `%${filters.setName}%`);
      }
      if (filters.characterSearch) {
        q = q.ilike('character', `%${filters.characterSearch}%`);
      }
      if (filters.cardNumberSearch) {
        q = q.ilike('card_number', `%${filters.cardNumberSearch}%`);
      }
      if (filters.minRawSales > 0) {
        q = q.gte('raw_sale_count', filters.minRawSales);
      }
      if (filters.minPsa10Sales > 0) {
        q = q.gte('psa10_sale_count', filters.minPsa10Sales);
      }
      if (filters.dateWindow > 0) {
        const since = new Date();
        since.setDate(since.getDate() - filters.dateWindow);
        q = q.gte('last_updated_at', since.toISOString());
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as OnepieceMarketRow[];
    },
  });
}

export function useOnepieceListingDetails(normalizedCardKey: string | null) {
  return useQuery({
    queryKey: ['onepiece-listing-details', normalizedCardKey],
    enabled: !!normalizedCardKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ebay_listing_cache')
        .select('*')
        .eq('normalized_card_key', normalizedCardKey!)
        .eq('junk_flag', false)
        .order('sold_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useOnepieceDiagnostics() {
  return useQuery({
    queryKey: ['onepiece-diagnostics'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('onepiece-ingest', {
        body: { action: 'counts' },
      });
      if (error) throw error;
      return data as { cacheCount: number; groupedCount: number };
    },
    refetchInterval: false,
  });
}

export function useOnepieceIngest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { action: string; listings?: unknown[] }) => {
      const { data, error } = await supabase.functions.invoke('onepiece-ingest', {
        body: payload,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onepiece-market'] });
      qc.invalidateQueries({ queryKey: ['onepiece-diagnostics'] });
      qc.invalidateQueries({ queryKey: ['onepiece-listing-details'] });
    },
  });
}

export function exportMarketCsv(rows: OnepieceMarketRow[]) {
  const headers = [
    'normalized_card_key', 'game', 'character', 'card_number', 'set_name', 'rarity',
    'variant', 'language', 'raw_avg_price_usd', 'raw_median_price_usd', 'raw_sale_count',
    'raw_prices_usd', 'raw_sold_dates', 'raw_source_urls', 'psa10_avg_price_usd',
    'psa10_median_price_usd', 'psa10_sale_count', 'psa10_prices_usd', 'psa10_sold_dates',
    'psa10_source_urls', 'price_spread_usd', 'multiple', 'match_confidence', 'notes',
    'last_updated_at',
  ];

  const formatArr = (arr: string[] | null) => arr?.length ? `"${arr.join('|')}"` : '';
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csvRows = [headers.join(',')];
  for (const r of rows) {
    csvRows.push([
      esc(r.normalized_card_key), esc(r.game), esc(r.character), esc(r.card_number),
      esc(r.set_name), esc(r.rarity), esc(r.variant), esc(r.language),
      esc(r.raw_avg_price_usd), esc(r.raw_median_price_usd), esc(r.raw_sale_count),
      formatArr(r.raw_prices_usd), formatArr(r.raw_sold_dates), formatArr(r.raw_source_urls),
      esc(r.psa10_avg_price_usd), esc(r.psa10_median_price_usd), esc(r.psa10_sale_count),
      formatArr(r.psa10_prices_usd), formatArr(r.psa10_sold_dates), formatArr(r.psa10_source_urls),
      esc(r.price_spread_usd), esc(r.multiple), esc(r.match_confidence), esc(r.notes),
      esc(r.last_updated_at),
    ].join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `onepiece-market-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
