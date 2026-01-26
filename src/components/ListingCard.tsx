import { ExternalLink, Clock, Gavel, ShoppingCart, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      className="group overflow-hidden bg-card/70 backdrop-blur-xl border-border/30 shadow-card hover:shadow-cardHover transition-all duration-300 animate-fadeIn"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="aspect-square relative bg-muted overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
        
        <div className="absolute top-3 left-3">
          {item.buyingOption === 'AUCTION' ? (
            <Badge className="bg-auction text-auction-foreground font-semibold shadow-sm">
              <Gavel className="h-3 w-3 mr-1" />
              Auction
            </Badge>
          ) : item.buyingOption === 'FIXED_PRICE' ? (
            <Badge className="bg-buyNow text-buyNow-foreground font-semibold shadow-sm">
              <ShoppingCart className="h-3 w-3 mr-1" />
              Buy It Now
            </Badge>
          ) : null}
        </div>

        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          {onToggleWatchlist && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleWatchlist(item);
              }}
              className={cn(
                "p-2 rounded-full transition-all duration-200",
                "bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm",
                isInWatchlist && "text-[#4B9CD3]"
              )}
              aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            >
              <Heart 
                className={cn(
                  "h-5 w-5 transition-all duration-200",
                  isInWatchlist ? "fill-current" : "hover:scale-110"
                )} 
              />
            </button>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <h3 className="font-medium text-sm line-clamp-2 leading-snug min-h-[2.5rem]">
          {item.title}
        </h3>

        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-display text-price">
              {formatPrice(item.price.value, item.price.currency)}
            </span>
            {item.buyingOption === 'AUCTION' && (
              <span className="text-xs text-muted-foreground">current bid</span>
            )}
          </div>
          
          {item.shipping && (
            <p className="text-sm text-shipping">
              {parseFloat(item.shipping.value) === 0 
                ? 'Free shipping' 
                : `+ ${formatPrice(item.shipping.value, item.shipping.currency)} shipping`}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate max-w-[60%]">{item.condition}</span>
          {item.endDate && item.buyingOption === 'AUCTION' && (
            <span className="flex items-center gap-1 text-auction font-medium">
              <Clock className="h-3 w-3" />
              {getTimeRemaining(item.endDate)}
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          asChild
        >
          <a href={item.itemUrl} target="_blank" rel="noopener noreferrer">
            View on eBay
            <ExternalLink className="h-3.5 w-3.5 ml-2" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
