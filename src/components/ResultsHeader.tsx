import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsHeaderProps {
  query: string;
  total: number;
  showing: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

export function ResultsHeader({ 
  query, 
  total, 
  showing, 
  hasMore, 
  isLoadingMore, 
  onLoadMore 
}: ResultsHeaderProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border/50">
      <div>
        <h2 className="text-lg font-semibold font-display">
          Results for "<span className="text-primary">{query}</span>"
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
  );
}
