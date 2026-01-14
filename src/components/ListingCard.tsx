import { ExternalLink, Clock, Gavel, ShoppingCart, Heart, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EbayItem } from "@/types/ebay";
import { formatDistanceToNow, format } from "date-fns";
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

  const formatSoldDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Unknown date';
    }
  };

  const totalPrice = parseFloat(item.price.value) + (item.shipping ? parseFloat(item.shipping.value) : 0);

  return (
    <Card 
      className={cn(
        "group overflow-hidden border-border shadow-card hover:shadow-cardHover transition-all duration-300 animate-fadeIn",
        "hover:border-primary/50 hover:glow-sm",
        item.isSold && "border-sold/30"
      )}
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
          {item.isSold ? (
            <Badge className="bg-sold text-sold-foreground font-semibold shadow-sm">
              <CheckCircle className="h-3 w-3 mr-1" />
              Sold
            </Badge>
          ) : item.buyingOption === 'AUCTION' ? (
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

        {onToggleWatchlist && !item.isSold && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWatchlist(item);
            }}
            className={cn(
              "absolute top-3 right-3 p-2 rounded-full transition-all duration-200",
              "bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm",
              isInWatchlist && "text-primary"
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

      <CardContent className="p-4 space-y-3">
        <h3 className="font-medium text-sm line-clamp-2 leading-snug min-h-[2.5rem]">
          {item.title}
        </h3>

        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-xl font-bold font-display",
              item.isSold ? "text-sold" : "text-price"
            )}>
              {item.isSold && item.soldPrice 
                ? formatPrice(item.soldPrice.value, item.soldPrice.currency)
                : formatPrice(item.price.value, item.price.currency)
              }
            </span>
            {item.isSold ? (
              <span className="text-xs text-muted-foreground">sold price</span>
            ) : item.buyingOption === 'AUCTION' && (
              <span className="text-xs text-muted-foreground">current bid</span>
            )}
          </div>
          
          {!item.isSold && item.shipping && (
            <p className="text-sm text-shipping">
              {parseFloat(item.shipping.value) === 0 
                ? 'Free shipping' 
                : `+ ${formatPrice(item.shipping.value, item.shipping.currency)} shipping`}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate max-w-[60%]">{item.condition}</span>
          {item.isSold && item.soldDate ? (
            <span className="flex items-center gap-1 text-sold font-medium">
              <CheckCircle className="h-3 w-3" />
              {formatSoldDate(item.soldDate)}
            </span>
          ) : item.endDate && item.buyingOption === 'AUCTION' && (
            <span className="flex items-center gap-1 text-auction font-medium">
              <Clock className="h-3 w-3" />
              {getTimeRemaining(item.endDate)}
            </span>
          )}
        </div>

        {item.itemUrl && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors border-border"
            asChild
          >
            <a href={item.itemUrl} target="_blank" rel="noopener noreferrer">
              View on eBay
              <ExternalLink className="h-3.5 w-3.5 ml-2" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
