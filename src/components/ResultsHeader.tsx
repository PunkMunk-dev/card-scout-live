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
    <div className="flex items-center justify-between h-8 px-4 border-b border-border/20 bg-secondary/10">
      <p className="text-xs text-muted-foreground">
        Showing: <span className="text-foreground">{total.toLocaleString()} listings</span>
      </p>
      
      <Button
        size="sm"
        variant="outline"
        className="h-6 text-[10px] px-2"
        onClick={onLoadMore}
        disabled={isLoadingMore || !hasMore}
      >
        {isLoadingMore ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Loading...
          </>
        ) : hasMore ? (
          "Load More"
        ) : (
          "All Loaded"
        )}
      </Button>
    </div>
  );
}
