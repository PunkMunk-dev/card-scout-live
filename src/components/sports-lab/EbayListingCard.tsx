import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SoldCompsDialog } from './SoldCompsDialog';
import { GemRateBadge } from './GemRateBadge';
import { WatchlistStar } from './WatchlistStar';
import { buildEbaySoldPsa10Url, buildGemRateUrl } from '@/lib/sportsCardsProUrl';
import type { EbayListing } from '@/types/sportsEbay';

const GRADING_COST = 25;

export function EbayListingCard({ listing, sportKey, isAuctionMode }: { listing: EbayListing; sportKey?: string | null; isAuctionMode?: boolean }) {
  const [showComps, setShowComps] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isEndingSoon, setIsEndingSoon] = useState(false);
  const [imageSrc, setImageSrc] = useState(listing.imageUrl);
  const [imageError, setImageError] = useState(false);

  const isBuyItNow = listing.buyingOptions?.includes('FIXED_PRICE');
  const isAuction = listing.buyingOptions?.includes('AUCTION');

  const handleImageError = useCallback(() => {
    if (listing.imageUrl && !imageError) {
      setImageError(true);
      setImageSrc(listing.imageUrl.replace('/s-l1600', '/s-l500').replace('/s-l800', '/s-l300'));
    }
  }, [listing.imageUrl, imageError]);

  useEffect(() => {
    if (!isAuctionMode || !isAuction || !listing.itemEndDate) { setTimeRemaining(null); return; }
    const calc = () => {
      const diff = new Date(listing.itemEndDate!).getTime() - Date.now();
      if (diff <= 0) { setTimeRemaining(null); return; }
      setIsEndingSoon(diff < 5 * 60 * 1000);
      const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000);
      setTimeRemaining(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [isAuctionMode, isAuction, listing.itemEndDate]);

  const soldMarketValue = listing.psa10MarketValue ?? null;
  const soldConfidence = listing.psa10MarketValueConfidence ?? null;
  const soldComps = listing.psa10SoldComps ?? [];
  const canCalcProfit = isBuyItNow && soldMarketValue !== null && listing.price !== null;
  const expectedProfit = canCalcProfit ? soldMarketValue - listing.price! - GRADING_COST : null;

  const { url: ebaySoldUrl } = buildEbaySoldPsa10Url({ playerName: listing.searchContext?.playerName || '', brand: listing.searchContext?.brand, year: listing.searchContext?.year, traits: listing.searchContext?.traits, title: listing.title });
  const { url: gemRateUrl } = buildGemRateUrl({ playerName: listing.searchContext?.playerName || '', brand: listing.searchContext?.brand, year: listing.searchContext?.year, traits: listing.searchContext?.traits, title: listing.title });

  return (
    <>
      <Card className="overflow-hidden rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
        <a href={listing.itemWebUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
          <div className="aspect-square bg-muted overflow-hidden relative">
            {listing.imageUrl ? <img src={imageSrc || listing.imageUrl} alt={listing.title} className="w-full h-full object-cover transition-transform duration-200 hover:scale-[1.02]" loading="lazy" onError={handleImageError} /> :
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[11px] font-semibold text-foreground/90 bg-black/50 backdrop-blur-sm">eBay</span>
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
              <WatchlistStar listing={listing} />
              {isAuction && <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-orange-400 bg-black/50 backdrop-blur-sm">Auction</span>}
              {isBuyItNow && <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-green-400 bg-black/50 backdrop-blur-sm">BIN</span>}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                  {listing.price !== null && <span className="text-xl font-extrabold text-white tabular-nums">${listing.price.toFixed(2)}</span>}
                  {listing.shippingCost !== null && listing.shippingCost > 0 && <span className="text-[11px] text-white/50">+${listing.shippingCost.toFixed(2)} ship</span>}
                </div>
                {isAuctionMode && isAuction && timeRemaining && <span className={cn("text-[11px] font-medium", isEndingSoon ? "text-orange-400" : "text-white/60")}>{timeRemaining}</span>}
              </div>
            </div>
          </div>
          <div className="p-3 space-y-2.5">
            <h3 className="text-[15px] font-semibold leading-tight line-clamp-2 min-h-[2.5rem]">{listing.title}</h3>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <a href={ebaySoldUrl} target="_blank" rel="noopener noreferrer" className="min-w-[52px] text-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-destructive/80 text-destructive-foreground hover:bg-destructive transition-colors">PSA 10</a>
              <GemRateBadge searchContext={listing.searchContext} fallbackUrl={gemRateUrl} />
            </div>
            {soldMarketValue !== null && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>PSA-10 Guide:</span><span className="font-medium text-foreground tabular-nums">${soldMarketValue.toFixed(2)}</span>
                {soldConfidence === 'low' && <span className="text-yellow-500" title="Low confidence">*</span>}
                {soldComps.length > 0 && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowComps(true); }} className="ml-0.5 text-primary hover:text-primary/80"><Info className="h-3.5 w-3.5" /></button>}
              </div>
            )}
            {expectedProfit !== null && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Est. Profit:</span>
                <span className={cn("font-semibold tabular-nums", expectedProfit >= 0 ? "text-green-500" : "text-destructive")}>{expectedProfit >= 0 ? '+' : ''}${expectedProfit.toFixed(0)}</span>
              </div>
            )}
            <div className="flex items-center justify-end pt-1 border-t border-border">
              <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await navigator.clipboard.writeText(listing.title); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </a>
      </Card>
      <SoldCompsDialog open={showComps} onOpenChange={setShowComps} soldComps={soldComps} marketValue={soldMarketValue} confidence={soldConfidence} />
    </>
  );
}
