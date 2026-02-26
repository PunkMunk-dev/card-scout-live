import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSportsWatchlist } from '@/contexts/SportsWatchlistContext';
import type { EbayListing } from '@/types/sportsEbay';

export function WatchlistStar({ listing }: { listing: EbayListing }) {
  const { isWatched, toggleWatchlist } = useSportsWatchlist();
  const watched = isWatched(listing.itemId);

  return (
    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWatchlist(listing); }}
      className={cn("w-7 h-7 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-colors",
        watched ? "text-[var(--om-accent)]" : "text-white/70 hover:text-white"
      )}
      aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}>
      <Star className={cn("h-3.5 w-3.5", watched && "fill-current")} />
    </button>
  );
}
