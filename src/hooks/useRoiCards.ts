import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

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
      let query = supabase
        .from('roi_cards')
        .select('*')
        .order('psa10_profit', { ascending: false });

      if (sport && sport !== 'All') {
        query = query.eq('sport', sport);
      }

      // Fetch all rows (may be >1000)
      const { data, error } = await query.limit(2500);
      if (error) throw error;
      return (data || []) as unknown as RoiCard[];
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
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
}
