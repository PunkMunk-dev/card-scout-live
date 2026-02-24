import { useState } from 'react';
import { Copy, Check, Star, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { EbayListing } from '@/types/tcg';
import { useSharedWatchlist } from '@/contexts/WatchlistContext';
import { tcgListingToEbayItem } from '@/lib/watchlistAdapters';

interface TerminalCardProps {
  listing: EbayListing;
}

export function TerminalCard({ listing }: TerminalCardProps) {
  const { isInWatchlist, toggleWatchlist } = useSharedWatchlist();
  const watched = isInWatchlist(listing.itemId);
  const [copied, setCopied] = useState(false);

  const handleToggleWatchlist = () => {
    toggleWatchlist(tcgListingToEbayItem(listing));
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

  const isAuction = listing.listingType === 'AUCTION';

  const gradedCompsUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(cleanTitle + ' PSA 10')}&LH_Complete=1&LH_Sold=1&_sacat=183454`;
  const gemUrl = `https://www.gemrate.com/search?q=${encodeURIComponent(cleanTitle)}`;

  return (
    <Card className="overflow-hidden rounded-lg border border-border/40 shadow-card hover:shadow-cardHover transition-all duration-200">
      <a href={listing.itemWebUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
        <div className="aspect-square bg-muted overflow-hidden relative">
          <img src={listing.image} alt={cleanTitle} className="w-full h-full object-cover transition-transform duration-200 hover:scale-[1.02]" loading="lazy" />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[11px] font-semibold text-foreground/90 bg-black/50 backdrop-blur-sm">eBay</span>
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleWatchlist(); }}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-colors",
                watched ? "text-primary" : "text-white/70 hover:text-white"
              )}
            >
              <Star className={cn("h-3.5 w-3.5", watched && "fill-current")} />
            </button>
            {isAuction && <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-orange-400 bg-black/50 backdrop-blur-sm">Auction</span>}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                {isAuction && listing.price.value === '0.00' ? (
                  <span className="text-sm text-white/60 italic">No bids yet</span>
                ) : (
                  <span className="text-lg font-bold text-white tabular-nums">${listing.price.value}</span>
                )}
                {listing.shipping && parseFloat(listing.shipping.cost) > 0 && (
                  <span className="text-[11px] text-white/50">+${listing.shipping.cost} ship</span>
                )}
              </div>
              {isAuction && listing.timeRemaining && (
                <span className="text-[11px] font-medium text-white/60 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {listing.timeRemaining}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="p-3 space-y-2.5">
          <h3 className="text-sm font-medium leading-snug line-clamp-2 min-h-[2.5rem]">{cleanTitle}</h3>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <a href={gradedCompsUrl} target="_blank" rel="noopener noreferrer" className="min-w-[52px] text-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-destructive/80 text-destructive-foreground hover:bg-destructive transition-colors">PSA 10</a>
            <a href={gemUrl} target="_blank" rel="noopener noreferrer" className="min-w-[42px] text-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/80 text-white hover:bg-blue-500 transition-colors">Gem</a>
          </div>
          <div className="flex items-center justify-end pt-1 border-t border-border">
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await navigator.clipboard.writeText(cleanTitle);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </a>
    </Card>
  );
}
