import { Heart, Trash2, ExternalLink, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WatchlistItem } from "@/types/ebay";

interface WatchlistPanelProps {
  watchlist: WatchlistItem[];
  onRemove: (itemId: string) => void;
  onClear: () => void;
}

export function WatchlistPanel({ watchlist, onRemove, onClear }: WatchlistPanelProps) {
  const formatPrice = (value: string, currency: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(num);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative h-8 px-3 text-xs bg-card border-border text-foreground hover:border-border-hover hover:bg-card transition-all duration-150"
        >
          <Heart className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          Watchlist
          {watchlist.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-full h-4 w-4 flex items-center justify-center">
              {watchlist.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-background border-border">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Heart className="h-4 w-4" />
            Watchlist ({watchlist.length})
          </SheetTitle>
        </SheetHeader>

        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <Heart className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">Your watchlist is empty</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Click the heart icon on any card to add it here
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-end mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors duration-150"
              >
                <Trash2 className="h-3 w-3 mr-1.5" />
                Clear All
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-160px)] mt-3">
              <div className="space-y-2 pr-4">
                {watchlist.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex gap-2.5 p-2.5 rounded-xl border border-border bg-card hover:border-border-hover transition-all duration-150"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-[hsl(var(--image-bg))] flex-shrink-0 border border-border/50">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium line-clamp-2 leading-snug text-foreground">
                        {item.title}
                      </h4>
                      <p className="text-xs font-semibold text-primary mt-1">
                        {formatPrice(item.price.value, item.price.currency)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:text-destructive transition-colors duration-150"
                        onClick={() => onRemove(item.itemId)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 transition-colors duration-150"
                        asChild
                      >
                        <a
                          href={item.itemUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
