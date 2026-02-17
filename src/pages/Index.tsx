import { useState, useCallback } from "react";
import { toast } from "sonner";
import { SearchBar } from "@/components/SearchBar";
import { SearchFilters } from "@/components/SearchFilters";
import { ListingGrid } from "@/components/ListingGrid";
import { LoadingGrid } from "@/components/LoadingGrid";
import { EmptyState } from "@/components/EmptyState";
import { ResultsHeader } from "@/components/ResultsHeader";
import { WatchlistPanel } from "@/components/WatchlistPanel";
import { searchEbay } from "@/lib/ebay-api";
import { useWatchlist } from "@/hooks/useWatchlist";
import type { EbayItem, SortOption } from "@/types/ebay";

function deriveBuyingOptions(sort: SortOption): 'ALL' | 'AUCTION' | 'FIXED_PRICE' {
  if (sort === 'auction_only') return 'AUCTION';
  if (sort === 'buy_now_only') return 'FIXED_PRICE';
  return 'ALL';
}

export default function Index() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<EbayItem[]>([]);
  const [total, setTotal] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sort, setSort] = useState<SortOption>("best");

  const { watchlist, isInWatchlist, toggleWatchlist, removeFromWatchlist, clearWatchlist } = useWatchlist();

  const performSearch = useCallback(async (
    searchQuery: string, 
    page: number = 1, 
    append: boolean = false,
    overrideSort?: SortOption
  ) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    const activeSort = overrideSort ?? sort;

    try {
      const response = await searchEbay({
        query: searchQuery,
        page,
        limit: 24,
        sort: activeSort,
        buyingOptions: deriveBuyingOptions(activeSort),
      });

      if (append) {
        setItems(prev => {
          const existingIds = new Set(prev.map(item => item.itemId));
          const newItems = response.items.filter(item => !existingIds.has(item.itemId));
          return [...prev, ...newItems];
        });
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
  }, [sort]);

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
      performSearch(query, 1, false, newSort);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-display">
            AI Card Finder
          </h1>
          <WatchlistPanel
            watchlist={watchlist}
            onRemove={removeFromWatchlist}
            onClear={clearWatchlist}
          />
        </div>
      </header>

      {/* Search Section */}
      <section className="border-b border-border/50 bg-card/30">
        <div className="container py-8">
          <SearchBar 
            onSearch={handleSearch} 
            onClear={handleClear}
            isLoading={isLoading} 
            showClear={hasSearched}
          />
        </div>
      </section>

      {/* Main Content */}
      <main className="container py-6 relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-accent/25 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-primary/15 rounded-full blur-3xl" />
        </div>
        {hasSearched && (
          <SearchFilters
            sort={sort}
            onSortChange={handleSortChange}
          />
        )}

        {isLoading ? (
          <div className="mt-6">
            <LoadingGrid />
          </div>
        ) : hasSearched && items.length > 0 ? (
          <div className="space-y-6">
            <ResultsHeader 
              query={query} 
              total={total} 
              showing={items.length}
              hasMore={!!nextPage}
              isLoadingMore={isLoadingMore}
              onLoadMore={handleLoadMore}
            />
            <ListingGrid 
              items={items}
              isInWatchlist={isInWatchlist}
              onToggleWatchlist={toggleWatchlist}
            />
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
