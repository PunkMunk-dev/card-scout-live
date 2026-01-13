import { Search } from "lucide-react";

interface EmptyStateProps {
  query?: string;
}

export function EmptyState({ query }: EmptyStateProps) {
  // Don't render anything on initial state - clean hero is enough
  if (!query) {
    return null;
  }

  // Only show empty state when search returns no results
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="bg-card/50 border border-border/50 rounded-2xl p-8 md:p-10 text-center max-w-md mx-auto backdrop-blur-sm">
        <div className="w-14 h-14 rounded-full bg-secondary/50 flex items-center justify-center mb-5 mx-auto">
          <Search className="h-6 w-6 text-muted-foreground/70" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          We couldn't find any listings for "<span className="font-medium text-foreground">{query}</span>". 
          Try adjusting your search terms or check for typos.
        </p>
      </div>
    </div>
  );
}