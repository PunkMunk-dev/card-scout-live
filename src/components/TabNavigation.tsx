import { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
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
          'transition-all font-medium',
          isMobile
            ? 'relative flex flex-col items-center gap-0.5 py-2 px-3 text-[11px]'
            : 'px-3 py-2 rounded-xl text-sm',
          isMobile
            ? isActive
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
            : isActive
              ? 'text-slate-900 bg-slate-100 border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8 flex h-14 md:h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex flex-col leading-none select-none shrink-0">
            <span className="text-[14px] md:text-[15px] font-semibold tracking-tight text-slate-900">OmniMarket</span>
            <span className="mt-0.5 text-[10px] tracking-[0.32em] uppercase text-slate-500">Cards</span>
          </Link>
          <nav className="flex items-center gap-1">{navItems}</nav>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <form onSubmit={handleHeaderSearch} className="w-[260px] md:w-[340px] lg:w-[420px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={headerQuery}
                onChange={(e) => setHeaderQuery(e.target.value)}
                placeholder="Search any card, set, or player..."
                className="flex h-10 md:h-11 w-full rounded-xl bg-white border border-slate-200 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all"
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
