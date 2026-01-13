import { Search } from "lucide-react";

interface EmptyStateProps {
  query?: string;
}

export function EmptyState({ query }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="bg-card border border-border rounded-2xl p-8 md:p-10 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-5 mx-auto">
          <Search className="h-7 w-7 text-muted-foreground" />
        </div>
        {query ? (
          <>
            <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We couldn't find any listings for "<span className="font-medium text-foreground">{query}</span>". 
              Try adjusting your search terms or check for typos.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-foreground mb-2">Start your search</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Enter a card name above to search eBay listings. Use specific details like year, set, and player name for best results.
            </p>
          </>
        )}
      </div>
    </div>
  );
}