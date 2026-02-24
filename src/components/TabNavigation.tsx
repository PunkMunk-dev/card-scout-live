import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Search, FlaskConical, Trophy } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Card Finder', icon: Search },
  { to: '/tcg', label: 'TCG Lab', icon: FlaskConical },
  { to: '/sports', label: 'Sports Lab', icon: Trophy },
];

export function TabNavigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
      <div className="container flex h-12 items-center gap-6">
        <span className="text-base font-bold font-display tracking-tight shrink-0">
          AI Card Finder
        </span>

        <nav className="flex items-center gap-1">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )
              }
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
