import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSportsWatchlist } from '@/contexts/SportsWatchlistContext';
import type { EbayListing } from '@/types/sportsEbay';

export function WatchlistStar({ listing }: { listing: EbayListing }) {
  const { isWatched, toggleWatchlist } = useSportsWatchlist();
  const watched = isWatched(listing.itemId);

  return (
    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWatchlist(listing); }}
      className={cn("relative w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-colors before:absolute before:inset-[-6px] before:content-['']",
        watched ? "text-[var(--om-accent)]" : "text-white/70 hover:text-white"
      )}
      aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}>
      <Star className={cn("h-4 w-4 sm:h-3.5 sm:w-3.5", watched && "fill-current")} />
    </button>
  );
}
