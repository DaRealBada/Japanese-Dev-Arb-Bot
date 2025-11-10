import {
  BarChart3,
  Home,
  TrendingUp,
  Trophy,
  Clock,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Active Opportunities",
    url: "/opportunities",
    icon: TrendingUp,
  },
  {
    title: "Leaderboards",
    url: "/leaderboards",
    icon: Trophy,
  },
  {
    title: "Reaction Times",
    url: "/reaction-times",
    icon: Clock,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" data-testid="sidebar-icon" />
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground" data-testid="sidebar-title">
              Arbitrage Analytics
            </h2>
            <p className="text-xs text-muted-foreground" data-testid="sidebar-subtitle">Real-time monitoring</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground" data-testid="sidebar-footer">
          <Settings className="h-3 w-3" />
          <span>Last updated: Live</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
