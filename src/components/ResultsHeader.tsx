import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsHeaderProps {
  query: string;
  total: number;
  showing: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  showSold?: boolean;
  averagePrice?: number;
  minPrice?: number;
  maxPrice?: number;
}

export function ResultsHeader({ 
  query, 
  total, 
  showing, 
  hasMore, 
  isLoadingMore, 
  onLoadMore,
  showSold,
  averagePrice,
  minPrice,
  maxPrice,
}: ResultsHeaderProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="flex flex-col gap-4 py-4 border-b border-border">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold font-display">
            {showSold ? (
              <>Sold Results for "<span className="text-sold">{query}</span>"</>
            ) : (
              <>Results for "<span className="text-primary">{query}</span>"</>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Showing {showing.toLocaleString()} of {total.toLocaleString()} listings
          </p>
        </div>
        
        {hasMore && (
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="border-border"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        )}
      </div>

      {/* Price Statistics for Sold Items */}
      {showSold && (averagePrice !== undefined || minPrice !== undefined || maxPrice !== undefined) && (
        <div className="flex flex-wrap gap-6 text-sm">
          {averagePrice !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Avg Price:</span>
              <span className="font-semibold text-sold">{formatCurrency(averagePrice)}</span>
            </div>
          )}
          {minPrice !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Min:</span>
              <span className="font-semibold text-foreground">{formatCurrency(minPrice)}</span>
            </div>
          )}
          {maxPrice !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Max:</span>
              <span className="font-semibold text-foreground">{formatCurrency(maxPrice)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
