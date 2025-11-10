import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/stats-card";
import { PlatformStatusCard } from "@/components/platform-status-card";
import { OpportunitiesTable } from "@/components/opportunities-table";
import { LeaderboardCard } from "@/components/leaderboard-card";
import {
  TrendingUp,
  Clock,
  Target,
  Activity,
} from "lucide-react";
import { DashboardStats, PlatformStatus, ArbitrageOpportunity, LeaderboardEntry } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: platformStatuses, isLoading: platformsLoading } = useQuery<PlatformStatus[]>({
    queryKey: ["/api/platforms/status"],
    refetchInterval: 10000,
  });

  const { data: recentOpportunities, isLoading: opportunitiesLoading } = useQuery<ArbitrageOpportunity[]>({
    queryKey: ["/api/opportunities/recent"],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time feel
  });

  const { data: topProfitPerDay } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard/profit-per-day"],
    refetchInterval: 15000,
  });

  const { data: topTotalProfit } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard/total-profit"],
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time arbitrage analytics across prediction markets
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Opportunities"
          value={stats?.totalOpportunities ?? 0}
          icon={Target}
          isLoading={statsLoading}
        />
        <StatsCard
          title="Active Now"
          value={stats?.activeOpportunities ?? 0}
          icon={TrendingUp}
          subtitle="Live arbitrage opportunities"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Avg Reaction Time"
          value={
            stats?.avgReactionTime
              ? `${Math.round(stats.avgReactionTime)}s`
              : "N/A"
          }
          icon={Clock}
          isLoading={statsLoading}
        />
        <StatsCard
          title="Markets Monitored"
          value={stats?.marketsMonitored ?? 0}
          icon={Activity}
          isLoading={statsLoading}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Platform Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {platformsLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-md border animate-pulse" />
            ))
          ) : (
            platformStatuses?.map((status) => (
              <PlatformStatusCard key={status.platform} status={status} />
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Opportunities</h2>
        <OpportunitiesTable
          opportunities={recentOpportunities?.slice(0, 10) ?? []}
          isLoading={opportunitiesLoading}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Top Performers</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LeaderboardCard
            title="Best Profit % Per Day"
            entries={topProfitPerDay?.slice(0, 10) ?? []}
            lastUpdated={
              topProfitPerDay?.[0]
                ? formatDistanceToNow(new Date(topProfitPerDay[0].detectedAt), {
                    addSuffix: true,
                  })
                : undefined
            }
          />
          <LeaderboardCard
            title="Best Total Profit %"
            entries={topTotalProfit?.slice(0, 10) ?? []}
            lastUpdated={
              topTotalProfit?.[0]
                ? formatDistanceToNow(new Date(topTotalProfit[0].detectedAt), {
                    addSuffix: true,
                  })
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
