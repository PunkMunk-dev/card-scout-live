import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { WatchlistDropdown } from '@/components/WatchlistDropdown';

const tabs = [
  { to: '/tcg', label: 'TCG Lab', shortLabel: 'TCG' },
  { to: '/sports', label: 'Sports Lab', shortLabel: 'Sports' },
];

export function TabNavigation() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [headerQuery, setHeaderQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = headerQuery.trim();
    if (!q) return;
    navigate(`/?q=${encodeURIComponent(q)}`);
    setHeaderQuery('');
  };

  const navItems = tabs.map(({ to, label, shortLabel }) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-1.5 transition-colors font-medium',
          isMobile
            ? 'flex-col gap-0.5 py-2 px-3 text-[11px]'
            : 'px-3.5 py-1.5 rounded-md text-sm',
          isActive
            ? isMobile
              ? 'text-primary'
              : 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          <span>{isMobile ? shortLabel : label}</span>
          {!isMobile && isActive && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
          )}
          {isMobile && isActive && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
          )}
        </>
      )}
    </NavLink>
  ));

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
        <div className="flex items-center justify-around">
          {navItems}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-0.5 py-2 px-3 text-[11px] transition-colors font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Search className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                <span>Search</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
                )}
              </>
            )}
          </NavLink>
        </div>
      </nav>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card backdrop-blur-md">
      <div className="container flex h-12 items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-base font-bold font-display tracking-tight shrink-0">
            OmniMarket Cards
          </span>
          <nav className="flex items-center gap-0.5">{navItems}</nav>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <form onSubmit={handleHeaderSearch} className={cn("transition-all duration-300 ease-out", isFocused ? "w-80" : "w-64")}>
            <div className={cn("relative rounded-md transition-all duration-300", isFocused && "ring-2 ring-primary/20 border-primary/50")}>
              <Search className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none transition-colors duration-300", isFocused ? "text-primary" : "text-muted-foreground")} />
              <Input
                type="text"
                value={headerQuery}
                onChange={(e) => setHeaderQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search cards..."
                className="h-8 pl-8 text-sm"
              />
            </div>
          </form>
          <WatchlistDropdown onSearchItem={(title) => {
            navigate(`/?q=${encodeURIComponent(title)}`);
          }} />
        </div>
      </div>
    </header>
  );
}
