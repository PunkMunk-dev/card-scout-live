import { NavLink } from 'react-router-dom';
import { Home, Layers, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/tcg', label: 'TCG', icon: Layers },
  { to: '/sports', label: 'Sports', icon: Trophy },
  { to: '/roi', label: 'Live', icon: TrendingUp },
];

export function MobileTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md safe-area-bottom" style={{ borderColor: 'var(--om-border-0)' }}>
      <div className="flex items-center justify-around">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-0.5 py-2 px-3 text-[11px] transition-colors font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
