import { useQuery } from "@tanstack/react-query";
import { LeaderboardCard } from "@/components/leaderboard-card";
import { LeaderboardEntry } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function LeaderboardsPage() {
  const { toast } = useToast();

  const { data: profitPerDay, isLoading: loadingPerDay } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard/profit-per-day"],
    refetchInterval: 15000,
  });

  const { data: totalProfit, isLoading: loadingTotal } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard/total-profit"],
    refetchInterval: 15000,
  });

  const handleExportCSV = async () => {
    try {
      const response = await apiRequest("POST", "/api/export/csv", {});
      toast({
        title: "Export Successful",
        description: response.message || "Leaderboard data exported to CSV",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leaderboards</h1>
          <p className="text-muted-foreground">
            Top performing arbitrage opportunities
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          data-testid="button-export-csv"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaderboardCard
          title="Leaderboard 1: Best Profit % Per Day"
          entries={profitPerDay ?? []}
          isLoading={loadingPerDay}
          lastUpdated={
            profitPerDay?.[0]
              ? formatDistanceToNow(new Date(profitPerDay[0].detectedAt), {
                  addSuffix: true,
                })
              : undefined
          }
        />
        <LeaderboardCard
          title="Leaderboard 2: Best Total Profit %"
          entries={totalProfit ?? []}
          isLoading={loadingTotal}
          lastUpdated={
            totalProfit?.[0]
              ? formatDistanceToNow(new Date(totalProfit[0].detectedAt), {
                  addSuffix: true,
                })
              : undefined
          }
        />
      </div>
    </div>
  );
}
