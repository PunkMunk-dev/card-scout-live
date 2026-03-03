import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

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

export interface RoiEbayListing {
  itemId: string;
  title: string;
  price: string;
  currency: string;
  imageUrl: string;
  itemUrl: string;
  condition: string;
}

export function useRoiEbayListings(cardName: string | null) {
  return useQuery({
    queryKey: ['roi-ebay-listings', cardName],
    queryFn: async () => {
      if (!cardName) return [];
      const { data, error } = await supabase.functions.invoke('roi-ebay-listings', {
        body: { cardName },
      });
      if (error) throw error;
      return (data?.listings || []) as RoiEbayListing[];
    },
    enabled: !!cardName,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/** Prefetch eBay listings for top ROI cards in background */
export function usePrefetchRoiEbayListings(cards: RoiCard[] | undefined, count = 10) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!cards || cards.length === 0) return;
    const topCards = cards.slice(0, count);
    topCards.forEach((card) => {
      queryClient.prefetchQuery({
        queryKey: ['roi-ebay-listings', card.card_name],
        queryFn: async () => {
          const { data, error } = await supabase.functions.invoke('roi-ebay-listings', {
            body: { cardName: card.card_name },
          });
          if (error) throw error;
          return (data?.listings || []) as RoiEbayListing[];
        },
        staleTime: 5 * 60 * 1000,
      });
    });
  }, [cards, count, queryClient]);
}
