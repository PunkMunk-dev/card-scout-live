import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Home, Layers, Trophy, TrendingUp, Star } from 'lucide-react';
import { setSession } from '@/lib/sessionStore';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useSharedWatchlist } from '@/contexts/WatchlistContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/tcg', label: 'TCG', icon: Layers },
  { to: '/sports', label: 'Sports', icon: Trophy },
  { to: '/roi', label: 'ROI', icon: TrendingUp },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { count: watchlistCount } = useSharedWatchlist();

  // Persist last route to session
  useEffect(() => {
    setSession({ lastRoute: location.pathname });
  }, [location.pathname]);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r"
      style={{
        '--sidebar-width': '200px',
        '--sidebar-width-icon': '56px',
      } as React.CSSProperties}
    >
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={collapsed ? item.label : undefined}
                    >
                      <NavLink
                        to={item.to}
                        end={item.to === '/'}
                        className={
                          isActive
                            ? 'border-l-2 transition-colors'
                            : 'border-l-2 border-transparent transition-colors hover:text-[var(--om-text-1)]'
                        }
                        activeClassName=""
                        style={
                          isActive
                            ? { background: 'var(--om-bg-2)', borderColor: 'var(--om-accent)', color: 'var(--om-text-0)' }
                            : { color: 'var(--om-text-3)' }
                        }
                      >
                        <item.icon className="h-[18px] w-[18px] shrink-0" />
                        {!collapsed && (
                          <span
                            className="text-xs"
                            style={{ color: isActive ? 'var(--om-text-0)' : 'var(--om-text-2)' }}
                          >
                            {item.label}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Watchlist shortcut — always visible */}
        <SidebarGroup className="mt-auto pb-4">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={collapsed ? `Watchlist (${watchlistCount})` : undefined}
                  style={{ color: 'var(--om-text-3)' }}
                >
                  <div className="relative">
                    <Star className="h-[18px] w-[18px] shrink-0 fill-current" style={{ color: 'var(--om-accent)' }} />
                    <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center leading-none">
                      {watchlistCount > 99 ? '99+' : watchlistCount}
                    </span>
                  </div>
                  {!collapsed && (
                    <span className="text-xs" style={{ color: 'var(--om-text-2)' }}>
                      Watchlist
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
