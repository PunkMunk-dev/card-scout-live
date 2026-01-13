import { useState, useCallback } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { SearchBar } from "@/components/SearchBar";
import { SearchFilters } from "@/components/SearchFilters";
import { ListingGrid } from "@/components/ListingGrid";
import { LoadingGrid } from "@/components/LoadingGrid";
import { EmptyState } from "@/components/EmptyState";
import { ResultsHeader } from "@/components/ResultsHeader";
import { WatchlistPanel } from "@/components/WatchlistPanel";
import { Button } from "@/components/ui/button";
import { searchEbay } from "@/lib/ebay-api";
import { useWatchlist } from "@/hooks/useWatchlist";
import type { EbayItem, SortOption, BuyingOption } from "@/types/ebay";

export default function Index() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<EbayItem[]>([]);
  const [total, setTotal] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Filters
  const [sort, setSort] = useState<SortOption>("best");
  const [buyingOption, setBuyingOption] = useState<BuyingOption>("ALL");
  const [includeLots, setIncludeLots] = useState(false);

  // Watchlist
  const { watchlist, isInWatchlist, toggleWatchlist, removeFromWatchlist, clearWatchlist } = useWatchlist();

  const performSearch = useCallback(async (searchQuery: string, page: number = 1, append: boolean = false) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await searchEbay({
        query: searchQuery,
        page,
        limit: 24,
        sort,
        includeLots,
        buyingOptions: buyingOption,
      });

      if (append) {
        setItems(prev => [...prev, ...response.items]);
      } else {
        setItems(response.items);
      }
      
      setTotal(response.total);
      setNextPage(response.nextPage);
      setHasSearched(true);
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to search eBay');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [sort, includeLots, buyingOption]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setItems([]);
    performSearch(newQuery, 1, false);
  };

  const handleClear = () => {
    setQuery("");
    setItems([]);
    setTotal(0);
    setNextPage(null);
    setHasSearched(false);
  };

  const handleLoadMore = () => {
    if (nextPage && query) {
      performSearch(query, nextPage, true);
    }
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    if (query && hasSearched) {
      setItems([]);
      performSearch(query, 1, false);
    }
  };

  const handleBuyingOptionChange = (newOption: BuyingOption) => {
    setBuyingOption(newOption);
    if (query && hasSearched) {
      setItems([]);
      performSearch(query, 1, false);
    }
  };

  const handleIncludeLotsChange = (include: boolean) => {
    setIncludeLots(include);
    if (query && hasSearched) {
      setItems([]);
      performSearch(query, 1, false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container py-5 flex items-center justify-between">
          <h1 className="text-xl font-medium font-display flex items-center gap-2 text-foreground">
            <CreditCard className="h-5 w-5 text-primary animate-float" />
            AI Card Finder
          </h1>
          <WatchlistPanel
            watchlist={watchlist}
            onRemove={removeFromWatchlist}
            onClear={clearWatchlist}
          />
        </div>
      </header>

      {/* Hero Section with Background Image */}
      <section 
        className="relative border-b border-border overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(to right, hsl(222 47% 4% / 0.92), hsl(222 47% 11% / 0.85)), url(/images/hero-basketball.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
        }}
      >
        {/* Hero content */}
        <div className="container py-16 md:py-20 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-3">
            Find Your Cards
          </h2>
          <p className="text-muted-foreground mb-10 max-w-md">
            AI-powered search for the best sports card deals
          </p>
          <SearchBar 
            onSearch={handleSearch} 
            onClear={handleClear}
            isLoading={isLoading} 
            showClear={hasSearched}
          />
        </div>
      </section>

      {/* Divider between hero and results */}
      <div className="h-px bg-border" />

      {/* Main Content */}
      <main className="container py-6">
        {hasSearched && (
          <SearchFilters
            sort={sort}
            onSortChange={handleSortChange}
            buyingOption={buyingOption}
            onBuyingOptionChange={handleBuyingOptionChange}
            includeLots={includeLots}
            onIncludeLotsChange={handleIncludeLotsChange}
          />
        )}

        {isLoading ? (
          <div className="mt-6">
            <LoadingGrid />
          </div>
        ) : hasSearched && items.length > 0 ? (
          <div className="space-y-6">
            <ResultsHeader query={query} total={total} showing={items.length} />
            <ListingGrid 
              items={items}
              isInWatchlist={isInWatchlist}
              onToggleWatchlist={toggleWatchlist}
            />
            
            {nextPage && (
              <div className="flex justify-center pt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="min-w-48 border-border hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-150"
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
              </div>
            )}
          </div>
        ) : hasSearched ? (
          <EmptyState query={query} />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}