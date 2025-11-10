import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeaderboardEntry } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardCardProps {
  title: string;
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  lastUpdated?: string;
}

export function LeaderboardCard({
  title,
  entries,
  isLoading,
  lastUpdated,
}: LeaderboardCardProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Award className="h-4 w-4 text-amber-600" />;
    return null;
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No data available yet</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {entries.map((entry) => {
                const isTopThree = entry.rank <= 3;
                return (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-md border ${
                      isTopThree ? "border-primary/20 bg-primary/5" : ""
                    }`}
                    data-testid={`leaderboard-entry-${entry.rank}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center justify-center w-8 h-8">
                          {getRankIcon(entry.rank) || (
                            <span className="font-mono font-bold text-muted-foreground">
                              {entry.rank}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate" title={entry.event} data-testid={`leaderboard-event-${entry.rank}`}>
                            {entry.event}
                          </div>
                          <div className="flex gap-1 items-center mt-1">
                            <Badge variant="outline" className="text-xs" data-testid={`leaderboard-platform-a-${entry.rank}`}>
                              {entry.platformA}
                            </Badge>
                            <span className="text-xs text-muted-foreground">↔</span>
                            <Badge variant="outline" className="text-xs" data-testid={`leaderboard-platform-b-${entry.rank}`}>
                              {entry.platformB}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-green-600 dark:text-green-400" data-testid={`leaderboard-profit-${entry.rank}`}>
                          {entry.profitPercentPerDay
                            ? `${parseFloat(entry.profitPercentPerDay.toString()).toFixed(2)}%/d`
                            : `${parseFloat(entry.profitPercent.toString()).toFixed(2)}%`}
                        </div>
                        {entry.daysUntilEvent && (
                          <div className="text-xs text-muted-foreground mt-1" data-testid={`leaderboard-days-${entry.rank}`}>
                            {entry.daysUntilEvent}d left
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
