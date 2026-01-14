import { ExternalLink, Clock, Gavel, ShoppingCart, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EbayItem } from "@/types/ebay";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  item: EbayItem;
  index: number;
  isInWatchlist?: boolean;
  onToggleWatchlist?: (item: EbayItem) => void;
}

export function ListingCard({ item, index, isInWatchlist, onToggleWatchlist }: ListingCardProps) {
  const formatPrice = (value: string, currency: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(num);
  };

  const getTimeRemaining = (endDate: string) => {
    try {
      return formatDistanceToNow(new Date(endDate), { addSuffix: true });
    } catch {
      return null;
    }
  };

  return (
    <Card 
      className="group overflow-hidden bg-card border-border rounded-2xl card-hover"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Image container */}
      <div className="aspect-square relative bg-[hsl(var(--image-bg))] overflow-hidden border-b border-border/50">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-contain p-2 group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No Image
          </div>
        )}
        
        {/* Badge */}
        <div className="absolute top-2.5 left-2.5">
          {item.buyingOption === 'AUCTION' ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md bg-secondary text-warning border border-border">
              <Gavel className="h-2.5 w-2.5" />
              Auction
            </span>
          ) : item.buyingOption === 'FIXED_PRICE' ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md bg-secondary text-success border border-border">
              <ShoppingCart className="h-2.5 w-2.5" />
              Buy Now
            </span>
          ) : null}
        </div>

        {/* Watchlist button */}
        {onToggleWatchlist && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWatchlist(item);
            }}
            className={cn(
              "absolute top-2.5 right-2.5 p-1.5 rounded-md transition-all duration-150",
              "bg-card/80 backdrop-blur-sm hover:bg-card border border-border hover:border-border-hover",
              isInWatchlist ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          >
            <Heart 
              className={cn(
                "h-4 w-4 transition-all duration-150",
                isInWatchlist && "fill-current"
              )} 
            />
          </button>
        )}
      </div>

      <CardContent className="p-3.5 space-y-2.5">
        {/* Title */}
        <h3 className="font-medium text-xs line-clamp-2 leading-relaxed min-h-[2.25rem] text-foreground">
          {item.title}
        </h3>

        {/* Price */}
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-primary">
              {formatPrice(item.price.value, item.price.currency)}
            </span>
            {item.buyingOption === 'AUCTION' && (
              <span className="text-[10px] text-muted-foreground">bid</span>
            )}
          </div>
          
          {item.shipping && (
            <p className="text-[11px] text-muted-foreground">
              {parseFloat(item.shipping.value) === 0 
                ? 'Free shipping' 
                : `+ ${formatPrice(item.shipping.value, item.shipping.currency)} shipping`}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="truncate max-w-[55%]">{item.condition}</span>
          {item.endDate && item.buyingOption === 'AUCTION' && (
            <span className="flex items-center gap-1 text-warning font-medium">
              <Clock className="h-2.5 w-2.5" />
              {getTimeRemaining(item.endDate)}
            </span>
          )}
        </div>

        {/* CTA Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs border-border hover:border-border-hover hover:bg-secondary transition-all duration-150"
          asChild
        >
          <a href={item.itemUrl} target="_blank" rel="noopener noreferrer">
            View on eBay
            <ExternalLink className="h-3 w-3 ml-1.5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
