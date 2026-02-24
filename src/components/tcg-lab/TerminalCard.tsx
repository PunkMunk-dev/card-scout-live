import { ExternalLink, TrendingDown, TrendingUp, Clock, Award, Diamond, Copy, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { EbayListing, SearchFilters } from '@/types/tcg';
import { useSharedWatchlist } from '@/contexts/WatchlistContext';
import { tcgListingToEbayItem } from '@/lib/watchlistAdapters';

interface TerminalCardProps {
  listing: EbayListing;
  setName?: string;
  rarityTag?: string;
  rank?: number;
  activeSort?: SearchFilters['sort'];
}

export function TerminalCard({ listing, setName, rarityTag, rank, activeSort }: TerminalCardProps) {
  const { isInWatchlist, toggleWatchlist } = useSharedWatchlist();
  const watched = isInWatchlist(listing.itemId);

  const handleToggleWatchlist = () => {
    toggleWatchlist(tcgListingToEbayItem(listing));
  };

  const handleView = () => {
    window.open(listing.itemWebUrl, '_blank', 'noopener,noreferrer');
  };

  const cleanTitle = listing.title
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);

  const handleGradedComps = () => {
    const query = encodeURIComponent(cleanTitle + ' PSA 10');
    window.open(
      `https://www.ebay.com/sch/i.html?_nkw=${query}&LH_Complete=1&LH_Sold=1&_sacat=183454`,
      '_blank', 'noopener,noreferrer'
    );
  };

  const handleGem = () => {
    const query = encodeURIComponent(cleanTitle);
    window.open(`https://www.gemrate.com/search?q=${query}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanTitle);
    toast.success('Copied to clipboard');
  };

  const isPriceSorted = activeSort === 'price_low' || activeSort === 'price_high';
  const isTopRanked = rank && rank <= 3 && isPriceSorted;

  return (
    <div className={cn(
      "group flex flex-col bg-card border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow",
      rank === 1 && isPriceSorted
        ? "border-primary/40 ring-1 ring-primary/20"
        : "border-border/30"
    )}>
      <div className="aspect-square relative overflow-hidden bg-muted">
        <div className="absolute top-2 left-2 z-10 flex gap-1">
          {isTopRanked && (
            <Badge variant="secondary" className="text-[10px] font-mono gap-1">
              {activeSort === 'price_low' ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              #{rank}
            </Badge>
          )}
          {listing.listingType === 'AUCTION' && (
            <Badge variant="destructive" className="text-[10px] font-medium">
              Auction
            </Badge>
          )}
        </div>

        {listing.timeRemaining && listing.listingType === 'AUCTION' && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="outline" className="bg-background/60 backdrop-blur-sm gap-1 text-[10px] border-border/50">
              <Clock className="h-2.5 w-2.5" />
              {listing.timeRemaining}
            </Badge>
          </div>
        )}
        <img src={listing.image} alt={cleanTitle} className="h-full w-full object-cover" loading="lazy" />
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        <p className="text-sm font-medium line-clamp-2 leading-snug min-h-[2.5rem]">{cleanTitle}</p>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {setName && <span>{setName}</span>}
          {setName && rarityTag && <span>•</span>}
          {rarityTag && <span className="text-primary/80">{rarityTag}</span>}
        </div>

        <div className="flex items-baseline justify-between mt-1">
          {listing.listingType === 'AUCTION' && listing.price.value === '0.00' ? (
            <span className="text-xs text-muted-foreground italic">No bids yet</span>
          ) : (
            <span className="text-lg font-bold tabular-nums flex items-center gap-1">
              ${listing.price.value}
            </span>
          )}
          {listing.shipping && parseFloat(listing.shipping.cost) > 0 && (
            <span className="text-xs text-muted-foreground">+${listing.shipping.cost}</span>
          )}
        </div>

        <div className="flex gap-1 mt-1">
          <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] font-medium border-border/30 hover:bg-secondary/50" onClick={handleView}>
            <ExternalLink className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={handleGradedComps} title="Graded comps on eBay">
            <Award className="h-3 w-3 mr-1" />
            Comps
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={handleGem} title="Check gem rates">
            <Diamond className="h-3 w-3 mr-1" />
            Gem
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={handleCopy} title="Copy card name">
            <Copy className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className={cn("h-7 w-7 p-0", watched ? "text-primary" : "text-muted-foreground hover:text-foreground")} onClick={handleToggleWatchlist} title={watched ? "Remove from watchlist" : "Add to watchlist"}>
            <Star className={cn("h-3 w-3", watched && "fill-current")} />
          </Button>
        </div>
      </div>
    </div>
  );
}
