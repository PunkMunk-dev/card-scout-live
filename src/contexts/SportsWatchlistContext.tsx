import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { EbayListing } from '@/types/sportsEbay';
import { useSharedWatchlist } from '@/contexts/WatchlistContext';
import { sportsListingToEbayItem } from '@/lib/watchlistAdapters';

export interface WatchlistItem extends EbayListing { addedAt: string; }

interface WatchlistContextValue {
  watchlist: WatchlistItem[];
  isWatched: (itemId: string) => boolean;
  addToWatchlist: (listing: EbayListing) => void;
  removeFromWatchlist: (itemId: string) => void;
  clearWatchlist: () => void;
  toggleWatchlist: (listing: EbayListing) => boolean;
  count: number;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);
const STORAGE_KEY = 'sports-watchlist';

export function SportsWatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) setWatchlist(JSON.parse(stored)); } catch {}
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist)); } catch {}
  }, [watchlist, isInitialized]);

  const isWatched = useCallback((itemId: string) => watchlist.some(i => i.itemId === itemId), [watchlist]);
  const addToWatchlist = useCallback((listing: EbayListing) => {
    setWatchlist(prev => prev.some(i => i.itemId === listing.itemId) ? prev : [...prev, { ...listing, addedAt: new Date().toISOString() }]);
  }, []);
  const removeFromWatchlist = useCallback((itemId: string) => setWatchlist(prev => prev.filter(i => i.itemId !== itemId)), []);
  const clearWatchlist = useCallback(() => setWatchlist([]), []);
  const shared = useSharedWatchlist();

  const toggleWatchlist = useCallback((listing: EbayListing) => {
    const watched = watchlist.some(i => i.itemId === listing.itemId);
    const ebayItem = sportsListingToEbayItem(listing);
    if (watched) { removeFromWatchlist(listing.itemId); shared.removeFromWatchlist(listing.itemId); return false; }
    else { addToWatchlist(listing); shared.addToWatchlist(ebayItem); return true; }
  }, [watchlist, addToWatchlist, removeFromWatchlist, shared]);

  return (
    <WatchlistContext.Provider value={{ watchlist, isWatched, addToWatchlist, removeFromWatchlist, clearWatchlist, toggleWatchlist, count: watchlist.length }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useSportsWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) throw new Error('useSportsWatchlist must be used within SportsWatchlistProvider');
  return context;
}
