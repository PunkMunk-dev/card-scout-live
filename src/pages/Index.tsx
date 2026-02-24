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
import { useSharedWatchlist } from "@/contexts/WatchlistContext";
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

  const { watchlist, isInWatchlist, toggleWatchlist, removeFromWatchlist, clearWatchlist } = useSharedWatchlist();

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
    <div className="min-h-[calc(100vh-48px)] bg-background pb-16 sm:pb-0">
      {/* Search Section */}
      <section className="bg-card border-b border-border">
        <div className="container py-6">
          <SearchBar 
            onSearch={handleSearch} 
            onClear={handleClear}
            isLoading={isLoading} 
            showClear={hasSearched}
          />
        </div>
      </section>

      {/* Toolbar: sort + watchlist + results count */}
      {hasSearched && (
        <div className="border-b border-border bg-card/50">
          <div className="container flex items-center justify-between gap-4 h-11">
            <div className="flex items-center gap-4">
              <SearchFilters sort={sort} onSortChange={handleSortChange} />
              <ResultsHeader 
                query={query} 
                total={total} 
                showing={items.length}
                hasMore={!!nextPage}
                isLoadingMore={isLoadingMore}
                onLoadMore={handleLoadMore}
              />
            </div>
            <WatchlistPanel
              watchlist={watchlist}
              onRemove={removeFromWatchlist}
              onClear={clearWatchlist}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container py-6">
        {isLoading ? (
          <LoadingGrid />
        ) : hasSearched && items.length > 0 ? (
          <ListingGrid 
            items={items}
            isInWatchlist={isInWatchlist}
            onToggleWatchlist={toggleWatchlist}
          />
        ) : hasSearched ? (
          <EmptyState query={query} />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}
