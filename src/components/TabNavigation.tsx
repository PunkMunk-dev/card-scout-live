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
              ? 'text-[#F5F7FF] bg-[rgba(10,132,255,0.12)] border border-[rgba(10,132,255,0.25)]'
              : 'text-[#7F8AA3] hover:text-[#B8C0D4] hover:bg-[rgba(255,255,255,0.06)]'
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
    <header className="sticky top-0 z-50 bg-[#0E1420] border-b border-white/10 shadow-[0_1px_0_rgba(255,255,255,0.06)]">
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8 flex h-14 md:h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex flex-col leading-none select-none shrink-0">
            <span className="text-[14px] md:text-[15px] font-semibold tracking-tight text-[#F5F7FF]">OmniMarket</span>
            <span className="mt-0.5 text-[10px] tracking-[0.32em] uppercase text-[#7F8AA3]">Cards</span>
          </Link>
          <nav className="flex items-center gap-1">{navItems}</nav>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <form onSubmit={handleHeaderSearch} className="w-[260px] md:w-[340px] lg:w-[420px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#59647C] pointer-events-none" />
              <input
                type="text"
                value={headerQuery}
                onChange={(e) => setHeaderQuery(e.target.value)}
                placeholder="Search any card, set, or player..."
                className="flex h-10 md:h-11 w-full rounded-xl bg-[#121A28] border border-[rgba(255,255,255,0.10)] pl-10 pr-3 text-sm text-[#F5F7FF] placeholder:text-[#59647C] focus:outline-none focus:ring-2 focus:ring-[rgba(10,132,255,0.20)] focus:border-[rgba(255,255,255,0.16)] transition-all"
              />
            </div>
          </form>
          <WatchlistDropdown onSearchItem={(query) => {
            navigate(`/?q=${encodeURIComponent(query)}&src=wl`);
          }} />
        </div>
      </div>
    </header>
  );
}
