import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const tabs = [
  { to: '/', label: 'Card Finder', shortLabel: 'Cards', icon: Search as typeof Search | null },
  { to: '/tcg', label: 'TCG Lab', shortLabel: 'TCG', icon: null },
  { to: '/sports', label: 'Sports Lab', shortLabel: 'Sports', icon: null },
];

export function TabNavigation() {
  const isMobile = useIsMobile();

  const navItems = tabs.map(({ to, label, shortLabel, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
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
          {Icon && (
            <Icon className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} strokeWidth={isActive ? 2.5 : 2} />
          )}
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
        </div>
      </nav>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card backdrop-blur-md">
      <div className="container flex h-12 items-center justify-between">
        <span className="text-base font-bold font-display tracking-tight shrink-0">
          OmniMarket Cards™
        </span>
        <nav className="flex items-center gap-0.5">{navItems}</nav>
      </div>
    </header>
  );
}
