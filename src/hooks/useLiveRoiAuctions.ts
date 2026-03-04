import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LiveRoiAuction {
  id: string;
  roi_card_id: string;
  item_id: string;
  listing_url: string;
  current_bid: number | null;
  shipping: number | null;
  end_time: string | null;
  image_url: string | null;
  last_seen_at: string;
}

interface UseLiveRoiAuctionsOpts {
  graceMinutes?: number;
  refetchIntervalMs?: number;
}

export function useLiveRoiAuctions(opts: UseLiveRoiAuctionsOpts = {}) {
  const { graceMinutes = 10, refetchIntervalMs = 25_000 } = opts;

  return useQuery<LiveRoiAuction[]>({
    queryKey: ['roi-live-auctions', graceMinutes],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - graceMinutes * 60_000).toISOString();
      const { data, error } = await supabase
        .from('roi_live_auctions')
        .select('*')
        .gte('last_seen_at', cutoff)
        .order('last_seen_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as LiveRoiAuction[];
    },
    refetchInterval: refetchIntervalMs,
  });
}
