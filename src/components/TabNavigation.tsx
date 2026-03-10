import { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Search, Sun, Moon, X, Star } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { WatchlistDropdown } from '@/components/WatchlistDropdown';

const tabs = [
  { to: '/tcg', label: 'TCG Market', shortLabel: 'TCG' },
  { to: '/sports', label: 'Sports Market', shortLabel: 'Sports' },
];

export function TabNavigation() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [headerQuery, setHeaderQuery] = useState('');
  const { theme, setTheme } = useTheme();

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = headerQuery.trim();
    if (!q) return;
    navigate(`/?q=${encodeURIComponent(q)}`);
    setHeaderQuery('');
  };

  const handleClear = () => {
    setHeaderQuery('');
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const navItems = tabs.map(({ to, label, shortLabel }) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) =>
        cn(
          'transition-all font-medium',
          isMobile
            ? 'relative flex flex-col items-center gap-0.5 py-2 px-3 text-[11px]'
            : 'px-2.5 py-1.5 rounded-lg text-xs',
          isMobile
            ? isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            : isActive
              ? 'text-[var(--om-text-0)] bg-[rgba(10,132,255,0.10)]'
              : 'text-[var(--om-text-2)] hover:text-[var(--om-text-1)] hover:bg-[var(--om-border-0)]'
        )
      }
    >
      {({ isActive }) => (
        <>
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
      <>
        {/* Mobile top search bar */}
        <header
          className="sticky top-0 z-50"
          style={{ background: 'var(--om-bg-1)', borderBottom: '1px solid var(--om-border-0)' }}
        >
          <div className="flex items-center gap-2 px-3 h-12">
            <Link to="/" className="shrink-0">
              <span className="text-[13px] font-semibold tracking-tight" style={{ color: 'var(--om-text-0)' }}>OM</span>
            </Link>
            <form onSubmit={handleHeaderSearch} className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'var(--om-text-3)' }} />
                <input
                  type="text"
                  value={headerQuery}
                  onChange={(e) => setHeaderQuery(e.target.value)}
                  placeholder="Search cards, sets, players…"
                  className="flex h-8 w-full rounded-lg pl-8 pr-7 text-xs om-input"
                />
                {headerQuery && (
                  <button type="button" onClick={handleClear} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="h-3 w-3" style={{ color: 'var(--om-text-3)' }} />
                  </button>
                )}
              </div>
            </form>
            <button onClick={toggleTheme} className="shrink-0 p-1.5 rounded-lg" style={{ color: 'var(--om-text-2)' }}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
          <div className="flex items-center justify-around">
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
                  <span>Home</span>
                  {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />}
                </>
              )}
            </NavLink>
            {navItems}
          </div>
        </nav>
      </>
    );
  }

  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: 'var(--om-bg-1)', borderBottom: '1px solid var(--om-border-0)' }}
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 flex h-11 items-center gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-baseline gap-1 select-none shrink-0">
          <span className="text-[13px] font-semibold tracking-tight" style={{ color: 'var(--om-text-0)' }}>OmniMarket</span>
          <span className="text-[9px] tracking-[0.28em] uppercase" style={{ color: 'var(--om-text-3)' }}>Cards</span>
        </Link>

        {/* Nav tabs */}
        <nav className="flex items-center gap-0.5">{navItems}</nav>

        {/* Global search — dominant */}
        <form onSubmit={handleHeaderSearch} className="flex-1 min-w-0 max-w-xl ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'var(--om-text-3)' }} />
            <input
              type="text"
              value={headerQuery}
              onChange={(e) => setHeaderQuery(e.target.value)}
              placeholder="Search all cards, sets, players, teams, characters…"
              className="flex h-8 w-full rounded-lg pl-9 pr-8 text-xs om-input"
            />
            {headerQuery && (
              <button type="button" onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="h-3 w-3" style={{ color: 'var(--om-text-3)' }} />
              </button>
            )}
          </div>
        </form>

        {/* Utility controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-[var(--om-bg-2)]"
            style={{ color: 'var(--om-text-2)' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <WatchlistDropdown onSearchItem={(query) => navigate(`/?q=${encodeURIComponent(query)}&src=wl`)} />
        </div>
      </div>
    </header>
  );
}
