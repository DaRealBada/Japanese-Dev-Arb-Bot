import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ConnectionStatus } from "@/components/connection-status";
import { PlatformFilters } from "@/components/platform-filters";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import OpportunitiesPage from "@/pages/opportunities";
import LeaderboardsPage from "@/pages/leaderboards";
import ReactionTimesPage from "@/pages/reaction-times";
import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { BarChart3 } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/opportunities" component={OpportunitiesPage} />
      <Route path="/leaderboards" component={LeaderboardsPage} />
      <Route path="/reaction-times" component={ReactionTimesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppHeader() {
  const { data: stats, dataUpdatedAt } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    refetchInterval: 10000,
  });

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between p-4 gap-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <div className="hidden md:flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold" data-testid="app-title">
              Arbitrage Analytics
            </h1>
          </div>
          <ConnectionStatus />
        </div>
        
        <div className="hidden lg:flex items-center gap-4">
          <PlatformFilters />
        </div>

        <div className="flex items-center gap-4">
          {dataUpdatedAt > 0 && (
            <span className="hidden md:inline text-xs text-muted-foreground" data-testid="last-updated">
              Updated {formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}
            </span>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 min-w-0">
              <AppHeader />
              <main className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-6">
                  <Router />
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
