import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock, Zap, TrendingDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArbitrageOpportunity } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface ReactionTimeStats {
  average: number;
  fastest: number;
  slowest: number;
  distribution: Array<{ range: string; count: number }>;
}

export default function ReactionTimesPage() {
  const { data: reactionStats, isLoading } = useQuery<ReactionTimeStats>({
    queryKey: ["/api/reaction-times/stats"],
    refetchInterval: 15000,
  });

  const { data: recentlyClosed, isLoading: loadingClosed } = useQuery<ArbitrageOpportunity[]>({
    queryKey: ["/api/reaction-times/closed"],
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reaction Times</h1>
        <p className="text-muted-foreground">
          Analysis of market reaction speeds to arbitrage opportunities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Average Reaction Time"
          value={reactionStats?.average ? `${Math.round(reactionStats.average)}s` : "N/A"}
          icon={Clock}
          subtitle="Mean time to close gap"
          isLoading={isLoading}
        />
        <StatsCard
          title="Fastest Convergence"
          value={reactionStats?.fastest ? `${reactionStats.fastest}s` : "N/A"}
          icon={Zap}
          subtitle="Quickest market reaction"
          isLoading={isLoading}
        />
        <StatsCard
          title="Slowest Convergence"
          value={reactionStats?.slowest ? `${reactionStats.slowest}s` : "N/A"}
          icon={TrendingDown}
          subtitle="Longest lasting opportunity"
          isLoading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reaction Time Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-muted-foreground">Loading chart data...</div>
            </div>
          ) : reactionStats?.distribution && reactionStats.distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={reactionStats.distribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="range" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex flex-col items-center justify-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No reaction time data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently Closed Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingClosed ? (
            <div className="h-40 flex items-center justify-center">
              <div className="text-muted-foreground">Loading recent closures...</div>
            </div>
          ) : recentlyClosed && recentlyClosed.length > 0 ? (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Platforms</TableHead>
                    <TableHead className="text-right">Profit %</TableHead>
                    <TableHead className="text-right">Profit %/Day</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Closed</TableHead>
                    <TableHead className="text-right">Reaction Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentlyClosed.map((opp) => (
                    <TableRow key={opp.id}>
                      <TableCell className="max-w-xs truncate" title={opp.event}>{opp.event}</TableCell>
                      <TableCell>{opp.platformA} ↔ {opp.platformB}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{parseFloat(opp.profitPercent).toFixed(2)}%</TableCell>
                      <TableCell className="text-right font-mono text-sm">{opp.profitPercentPerDay ? `${parseFloat(opp.profitPercentPerDay).toFixed(2)}%` : "N/A"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(opp.detectedAt), { addSuffix: true })}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{opp.closedAt ? formatDistanceToNow(new Date(opp.closedAt), { addSuffix: true }) : "-"}</TableCell>
                      <TableCell className="text-right font-mono">{opp.reactionTimeSeconds ? `${opp.reactionTimeSeconds}s` : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center">
              <Clock className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No recently closed opportunities</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
