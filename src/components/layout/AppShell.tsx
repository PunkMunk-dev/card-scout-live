import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { OmniLogo } from '@/components/branding/OmniLogo';
import { WatchlistDropdown } from '@/components/WatchlistDropdown';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTabBar } from '@/components/layout/MobileTabBar';
import { GlobalSearchProvider, useGlobalSearch } from '@/contexts/GlobalSearchContext';

interface AppShellProps {
  children: React.ReactNode;
}

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/tcg': 'TCG Market',
  '/sports': 'Sports Market',
  '/roi': 'Top ROI',
  '/ui-audit': 'UI Audit',
};

function ShellInner({ children }: AppShellProps) {
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { submitSearch } = useGlobalSearch();
  const [headerQuery, setHeaderQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onFocusSearch = () => {
      if (searchInputRef.current) { searchInputRef.current.focus(); return; }
      const el = document.querySelector<HTMLInputElement>('[data-omni-global-search="true"]');
      el?.focus();
    };
    window.addEventListener('omni:focus-search', onFocusSearch);
    return () => window.removeEventListener('omni:focus-search', onFocusSearch);
  }, []);

  const sectionLabel = ROUTE_LABELS[location.pathname] ?? '';

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = headerQuery.trim();
    if (!q) return;
    submitSearch(q);
    setHeaderQuery('');
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen w-full">
        <header
          className="sticky top-0 z-50 border-b shadow-sm flex items-center h-14 px-4 gap-3"
          style={{ background: 'var(--om-bg-1)', borderColor: 'var(--om-border-0)' }}
        >
          <Link to="/" className="shrink-0 select-none">
            <OmniLogo dark={theme === 'dark'} />
          </Link>
          <form onSubmit={handleHeaderSearch} className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--om-text-3)' }} />
              <input
                ref={searchInputRef}
                data-omni-global-search="true"
                type="text"
                value={headerQuery}
                onChange={(e) => setHeaderQuery(e.target.value)}
                placeholder="Search player, set, card…"
                className="flex h-9 w-full rounded-xl pl-9 pr-3 text-sm om-input"
              />
            </div>
          </form>
          <button
            onClick={toggleTheme}
            className="om-btn flex items-center justify-center h-9 w-9 rounded-xl shrink-0"
            style={{ background: 'var(--om-bg-2)', border: '1px solid var(--om-border-0)', color: 'var(--om-text-1)' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
        <MobileTabBar />
      </div>
    );
  }

  // Desktop: sidebar layout
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header
            className="sticky top-0 z-50 border-b shadow-sm"
            style={{ background: 'var(--om-bg-1)', borderColor: 'var(--om-border-0)' }}
          >
            <div className="flex h-14 items-center gap-4 px-4">
              <SidebarTrigger className="shrink-0" />
              <Link to="/" className="shrink-0 select-none">
                <OmniLogo dark={theme === 'dark'} />
              </Link>
              {sectionLabel && location.pathname !== '/' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{ color: 'var(--om-text-2)', background: 'var(--om-bg-2)' }}>
                  {sectionLabel}
                </span>
              )}
              <form onSubmit={handleHeaderSearch} className="flex-1 max-w-[480px] ml-auto">
                <div className="relative flex">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none z-10" style={{ color: 'var(--om-text-3)' }} />
                  <input
                    ref={searchInputRef}
                    data-omni-global-search="true"
                    type="text"
                    value={headerQuery}
                    onChange={(e) => setHeaderQuery(e.target.value)}
                    placeholder="Search player, set, card number…"
                    className="flex h-10 w-full rounded-l-xl pl-10 pr-3 text-sm om-input border-r-0"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 h-10 px-4 rounded-r-xl text-xs font-semibold shrink-0 transition-opacity hover:opacity-90"
                    style={{ background: 'var(--om-accent)', color: '#fff' }}
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">Search</span>
                  </button>
                </div>
              </form>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={toggleTheme}
                  className="om-btn flex items-center justify-center h-10 w-10 rounded-xl"
                  style={{ background: 'var(--om-bg-2)', border: '1px solid var(--om-border-0)', color: 'var(--om-text-1)' }}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <WatchlistDropdown onSearchItem={(query) => {
                  navigate(`/?q=${encodeURIComponent(query)}&src=wl`);
                }} />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <GlobalSearchProvider>
      <ShellInner>{children}</ShellInner>
    </GlobalSearchProvider>
  );
}
