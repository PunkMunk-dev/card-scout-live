import { useState } from "react";
import { ExternalLink, Gavel, ShoppingCart, Star, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EbayItem } from "@/types/ebay";
import { cn } from "@/lib/utils";
import { AuctionCountdownBadge } from "@/components/shared/AuctionCountdownBadge";
import { cleanListingTitle } from "@/lib/cleanTitle";

interface ListingCardProps {
  item: EbayItem;
  index: number;
  isInWatchlist?: boolean;
  onToggleWatchlist?: (item: EbayItem) => void;
}

export function ListingCard({ item, index, isInWatchlist, onToggleWatchlist }: ListingCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanListingTitle(item.title));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const formatPrice = (value: string, currency: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(num);
  };

  return (
    <div 
      className="group overflow-hidden bg-card border border-border/40 rounded-lg shadow-card hover:shadow-cardHover transition-all duration-200 animate-fadeIn"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Image */}
      <div className="aspect-square relative bg-muted overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No Image
          </div>
        )}
        
        {/* Type badge */}
        <div className="absolute top-2 left-2">
          {item.buyingOption === 'AUCTION' ? (
            <Badge className="bg-auction text-auction-foreground text-[10px] font-semibold shadow-sm px-1.5 py-0.5">
              <Gavel className="h-2.5 w-2.5 mr-0.5" />
              Auction
            </Badge>
          ) : item.buyingOption === 'FIXED_PRICE' ? (
            <Badge className="bg-buyNow text-buyNow-foreground text-[10px] font-semibold shadow-sm px-1.5 py-0.5">
              <ShoppingCart className="h-2.5 w-2.5 mr-0.5" />
              BIN
            </Badge>
          ) : null}
        </div>

        {/* Watchlist heart */}
        {onToggleWatchlist && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWatchlist(item);
            }}
            className={cn(
              "absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-colors",
              isInWatchlist ? "text-[var(--om-accent)]" : "text-white/70 hover:text-white"
            )}
            aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          >
            <Star className={cn("h-3.5 w-3.5", isInWatchlist && "fill-current")} />
          </button>
        )}

        {/* Auction countdown overlay */}
        {item.endDate && item.buyingOption === 'AUCTION' && (
          <AuctionCountdownBadge endDate={item.endDate} />
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <h3 className="font-medium text-xs line-clamp-2 leading-snug min-h-[2rem]">
          {item.title}
        </h3>

        <div className="space-y-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold tabular-nums">
              {formatPrice(item.price.value, item.price.currency)}
            </span>
            {item.buyingOption === 'AUCTION' && (
              <span className="text-[10px] text-muted-foreground">bid</span>
            )}
          </div>
          
          {item.shipping && (
            <p className="text-[10px] text-muted-foreground">
              {parseFloat(item.shipping.value) === 0 
                ? 'Free shipping' 
                : `+${formatPrice(item.shipping.value, item.shipping.currency)} ship`}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="truncate">{item.condition}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-[11px] group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            asChild
          >
            <a href={item.itemUrl} target="_blank" rel="noopener noreferrer">
              View on eBay
              <ExternalLink className="h-3 w-3 ml-1.5" />
            </a>
          </Button>
          <button
            onClick={handleCopy}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Copy title"
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}
