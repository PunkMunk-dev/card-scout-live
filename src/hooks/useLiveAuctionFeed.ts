import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import type { RoiCard } from '@/hooks/useRoiCards';
import type { LiveRoiAuction } from '@/hooks/useLiveRoiAuctions';

export interface LiveAuctionFeedItem {
  live: LiveRoiAuction;
  card: RoiCard;
}

interface UseLiveAuctionFeedOpts {
  minProfit?: number;
}

export function useLiveAuctionFeed(opts: UseLiveAuctionFeedOpts = {}) {
  const { minProfit = 0 } = opts;

  const cutoff = useMemo(
    () => new Date(Date.now() - 10 * 60_000).toISOString(),
    // recalc every render is fine — it's just a string comparison
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.floor(Date.now() / 30_000)]
  );

  const liveQuery = useQuery<LiveRoiAuction[]>({
    queryKey: ['live-auction-feed-live', cutoff],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roi_live_auctions')
        .select('*')
        .gte('last_seen_at', cutoff)
        .gte('end_time', new Date().toISOString())
        .order('end_time', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as LiveRoiAuction[];
    },
    refetchInterval: 30_000,
  });

  const cardIds = useMemo(() => {
    if (!liveQuery.data) return [];
    return [...new Set(liveQuery.data.map(r => r.roi_card_id))];
  }, [liveQuery.data]);

  const cardsQuery = useQuery<RoiCard[]>({
    queryKey: ['live-auction-feed-cards', cardIds],
    queryFn: async () => {
      if (cardIds.length === 0) return [];
      // Fetch in chunks of 100 for the IN filter
      const chunks: RoiCard[] = [];
      for (let i = 0; i < cardIds.length; i += 100) {
        const batch = cardIds.slice(i, i + 100);
        const { data, error } = await supabase
          .from('roi_cards')
          .select('*')
          .in('id', batch);
        if (error) throw error;
        chunks.push(...((data ?? []) as unknown as RoiCard[]));
      }
      return chunks;
    },
    enabled: cardIds.length > 0,
    refetchInterval: 60_000,
  });

  const feed = useMemo<LiveAuctionFeedItem[]>(() => {
    if (!liveQuery.data || !cardsQuery.data) return [];
    const cardMap = new Map(cardsQuery.data.map(c => [c.id, c]));

    let items = liveQuery.data
      .map(live => {
        const card = cardMap.get(live.roi_card_id);
        return card ? { live, card } : null;
      })
      .filter((x): x is LiveAuctionFeedItem => x !== null);

    // JS safety net: drop any auctions that ended between query and render
    const nowMs = Date.now();
    items = items.filter(i => {
      if (i.live.end_time && new Date(i.live.end_time).getTime() <= nowMs) return false;
      if (minProfit > 0 && (i.card.psa10_profit ?? 0) < minProfit) return false;
      return true;
    });

    // Ensure ending-soonest sort (DB should handle, but enforce here)
    items.sort((a, b) => {
      const aEnd = a.live.end_time ? new Date(a.live.end_time).getTime() : Infinity;
      const bEnd = b.live.end_time ? new Date(b.live.end_time).getTime() : Infinity;
      return aEnd - bEnd;
    });

    return items;
  }, [liveQuery.data, cardsQuery.data, minProfit]);

  return {
    data: feed,
    isLoading: liveQuery.isLoading || (cardIds.length > 0 && cardsQuery.isLoading),
    isFetching: liveQuery.isFetching,
    error: liveQuery.error || cardsQuery.error,
    refetch: liveQuery.refetch,
  };
}
