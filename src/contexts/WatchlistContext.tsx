import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { EbayItem, WatchlistItem } from '@/types/ebay';

interface WatchlistContextValue {
  watchlist: WatchlistItem[];
  addToWatchlist: (item: EbayItem) => void;
  removeFromWatchlist: (itemId: string) => void;
  isInWatchlist: (itemId: string) => boolean;
  toggleWatchlist: (item: EbayItem) => void;
  clearWatchlist: () => void;
  count: number;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);
const WATCHLIST_KEY = 'ebay-card-watchlist';

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const idSet = useMemo(() => new Set(watchlist.map(i => i.itemId)), [watchlist]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      if (stored) setWatchlist(JSON.parse(stored));
    } catch {}
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist)); } catch {}
  }, [watchlist, isInitialized]);

  const isInWatchlist = useCallback((itemId: string) => idSet.has(itemId), [idSet]);

  const addToWatchlist = useCallback((item: EbayItem) => {
    setWatchlist(prev => prev.some(i => i.itemId === item.itemId) ? prev : [...prev, { ...item, addedAt: Date.now() }]);
  }, []);

  const removeFromWatchlist = useCallback((itemId: string) => {
    setWatchlist(prev => prev.filter(i => i.itemId !== itemId));
  }, []);

  const toggleWatchlist = useCallback((item: EbayItem) => {
    setWatchlist(prev => {
      if (prev.some(i => i.itemId === item.itemId)) {
        return prev.filter(i => i.itemId !== item.itemId);
      }
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  }, []);

  const clearWatchlist = useCallback(() => setWatchlist([]), []);

  return (
    <WatchlistContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, toggleWatchlist, clearWatchlist, count: watchlist.length }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useSharedWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) throw new Error('useSharedWatchlist must be used within WatchlistProvider');
  return context;
}
