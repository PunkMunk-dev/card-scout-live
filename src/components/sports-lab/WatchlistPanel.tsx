import { Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSportsWatchlist } from '@/contexts/SportsWatchlistContext';
import { EbayListingCard } from './EbayListingCard';

export function WatchlistPanel({ sportKey }: { sportKey?: string | null }) {
  const { watchlist, clearWatchlist, count } = useSportsWatchlist();

  if (count === 0) return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4"><Star className="h-8 w-8 text-muted-foreground/50" /></div>
      <h2 className="text-lg font-bold mb-2">No Cards Saved</h2>
      <p className="text-sm text-muted-foreground/70">Click the star icon on any card to add it to your watchlist.</p>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <p className="text-sm text-muted-foreground">{count} card{count !== 1 ? 's' : ''} saved</p>
        <Button variant="ghost" size="sm" onClick={clearWatchlist} className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4 mr-1.5" />Clear All
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">{watchlist.map(item => <EbayListingCard key={item.itemId} listing={item} sportKey={sportKey} />)}</div>
      </ScrollArea>
    </div>
  );
}
