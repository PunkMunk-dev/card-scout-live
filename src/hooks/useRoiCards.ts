import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RoiCard {
  id: string;
  sport: string;
  card_name: string;
  raw_avg: number | null;
  psa9_avg: number | null;
  psa9_gain: number | null;
  multiplier: number | null;
  psa10_avg: number | null;
  psa10_profit: number | null;
}

export function useRoiCards(sport?: string) {
  return useQuery({
    queryKey: ['roi-cards', sport],
    queryFn: async () => {
      const PAGE = 1000;
      let all: RoiCard[] = [];
      let from = 0;

      while (true) {
        let query = supabase
          .from('roi_cards')
          .select('*')
          .order('psa10_profit', { ascending: false })
          .range(from, from + PAGE - 1);

        if (sport && sport !== 'All') {
          query = query.eq('sport', sport);
        }

        const { data, error } = await query;
        if (error) throw error;
        all = all.concat((data || []) as unknown as RoiCard[]);
        if (!data || data.length < PAGE) break;
        from += PAGE;
      }

      return all;
    },
  });
}
