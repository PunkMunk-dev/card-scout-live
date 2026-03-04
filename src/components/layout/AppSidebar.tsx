import { useLocation } from 'react-router-dom';
import { Search, Layers, Trophy, TrendingUp, Star } from 'lucide-react';
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
  { to: '/', label: 'Search', icon: Search },
  { to: '/tcg', label: 'TCG Market', icon: Layers },
  { to: '/sports', label: 'Sports Market', icon: Trophy },
  { to: '/roi', label: 'Top ROI', icon: TrendingUp },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { count: watchlistCount } = useSharedWatchlist();

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
                        className="hover:bg-sidebar-accent/50"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Watchlist shortcut */}
        {watchlistCount > 0 && (
          <SidebarGroup className="mt-auto pb-4">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={collapsed ? `Watchlist (${watchlistCount})` : undefined}
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  >
                    <div className="relative">
                      <Star className="h-4 w-4 shrink-0 fill-current" style={{ color: 'var(--om-accent)' }} />
                      <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center leading-none">
                        {watchlistCount > 99 ? '99+' : watchlistCount}
                      </span>
                    </div>
                    {!collapsed && <span className="text-sm">Watchlist</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
