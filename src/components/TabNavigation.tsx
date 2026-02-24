import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Search, FlaskConical, Trophy } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSharedWatchlist } from '@/contexts/WatchlistContext';
import { useTcgWatchlist } from '@/hooks/useTcgWatchlist';
import { useSportsWatchlist } from '@/contexts/SportsWatchlistContext';

const tabs = [
  { to: '/', label: 'Card Finder', shortLabel: 'Cards', icon: Search, watchlistKey: 'cards' as const },
  { to: '/tcg', label: 'TCG Lab', shortLabel: 'TCG', icon: FlaskConical, watchlistKey: 'tcg' as const },
  { to: '/sports', label: 'Sports Lab', shortLabel: 'Sports', icon: Trophy, watchlistKey: 'sports' as const },
];

function WatchlistBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function useWatchlistCounts() {
  const { count: cardsCount } = useSharedWatchlist();
  const { data: tcgWatchlist } = useTcgWatchlist();
  const { count: sportsCount } = useSportsWatchlist();
  return {
    cards: cardsCount,
    tcg: tcgWatchlist?.length ?? 0,
    sports: sportsCount,
  };
}

export function TabNavigation() {
  const isMobile = useIsMobile();
  const counts = useWatchlistCounts();

  const navItems = tabs.map(({ to, label, shortLabel, icon: Icon, watchlistKey }) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-1.5 transition-colors font-medium',
          isMobile
            ? 'flex-col gap-0.5 py-2 px-3 text-[11px]'
            : 'px-3 py-1.5 rounded-md text-xs',
          isActive
            ? isMobile
              ? 'text-primary'
              : 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative">
            <Icon className={cn(isMobile ? 'h-5 w-5' : 'h-3.5 w-3.5')} />
            <WatchlistBadge count={counts[watchlistKey]} />
          </span>
          <span>{isMobile ? shortLabel : label}</span>
          {isMobile && isActive && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
          )}
        </>
      )}
    </NavLink>
  ));

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-md safe-area-bottom">
        <div className="flex items-center justify-around">
          {navItems}
        </div>
      </nav>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
      <div className="container">
        <div className="flex h-10 items-center">
          <span className="text-base font-bold font-display tracking-tight">
            OmniMarket™
          </span>
        </div>
        <nav className="flex items-center gap-1 pb-2">{navItems}</nav>
      </div>
    </header>
  );
}
