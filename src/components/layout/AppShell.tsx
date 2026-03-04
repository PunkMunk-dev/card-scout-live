import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { OmniLogo } from '@/components/branding/OmniLogo';
import { WatchlistDropdown } from '@/components/WatchlistDropdown';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTabBar } from '@/components/layout/MobileTabBar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { theme, setTheme } = useTheme();
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

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen w-full">
        {/* Mobile top bar */}
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
                type="text"
                value={headerQuery}
                onChange={(e) => setHeaderQuery(e.target.value)}
                placeholder="Search any card..."
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
          {/* Desktop top bar */}
          <header
            className="sticky top-0 z-50 border-b shadow-sm"
            style={{ background: 'var(--om-bg-1)', borderColor: 'var(--om-border-0)' }}
          >
            <div className="flex h-14 items-center gap-4 px-4">
              <SidebarTrigger className="shrink-0" />
              <Link to="/" className="shrink-0 select-none">
                <OmniLogo dark={theme === 'dark'} />
              </Link>
              <form onSubmit={handleHeaderSearch} className="flex-1 max-w-[480px] ml-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--om-text-3)' }} />
                  <input
                    type="text"
                    value={headerQuery}
                    onChange={(e) => setHeaderQuery(e.target.value)}
                    placeholder="Search any card, set, or player..."
                    className="flex h-10 w-full rounded-xl pl-10 pr-3 text-sm om-input"
                  />
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
