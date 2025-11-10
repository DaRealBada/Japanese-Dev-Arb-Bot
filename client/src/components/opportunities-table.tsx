import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArbitrageOpportunity } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronRight, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface OpportunitiesTableProps {
  opportunities: ArbitrageOpportunity[];
  isLoading?: boolean;
}

export function OpportunitiesTable({ opportunities, isLoading }: OpportunitiesTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No Active Opportunities</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Waiting for arbitrage opportunities to be detected...
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Platform Pair</TableHead>
            <TableHead>Market Event</TableHead>
            <TableHead className="text-right">Price A</TableHead>
            <TableHead className="text-right">Price B</TableHead>
            <TableHead className="text-right">Profit %</TableHead>
            <TableHead className="text-right">Profit %/Day</TableHead>
            <TableHead>Detected</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.map((opp) => {
            const isExpanded = expandedRow === opp.id;
            return (
              <>
                <TableRow
                  key={opp.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => setExpandedRow(isExpanded ? null : opp.id)}
                  data-testid={`opportunity-row-${opp.id}`}
                >
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      data-testid={`button-expand-${opp.id}`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex gap-1 items-center">
                      <Badge variant="outline" className="text-xs" data-testid={`platform-a-${opp.id}`}>
                        {opp.platformA}
                      </Badge>
                      <span className="text-muted-foreground">↔</span>
                      <Badge variant="outline" className="text-xs" data-testid={`platform-b-${opp.id}`}>
                        {opp.platformB}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={opp.event} data-testid={`event-${opp.id}`}>
                    {opp.event}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm" data-testid={`price-a-${opp.id}`}>
                    {parseFloat(opp.priceA).toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm" data-testid={`price-b-${opp.id}`}>
                    {parseFloat(opp.priceB).toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-green-600 dark:text-green-400" data-testid={`profit-percent-${opp.id}`}>
                    {parseFloat(opp.profitPercent).toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm" data-testid={`profit-per-day-${opp.id}`}>
                    {opp.profitPercentPerDay
                      ? `${parseFloat(opp.profitPercentPerDay).toFixed(2)}%`
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground" data-testid={`detected-at-${opp.id}`}>
                    {formatDistanceToNow(new Date(opp.detectedAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        opp.status === "active"
                          ? "default"
                          : opp.status === "closing"
                          ? "secondary"
                          : "outline"
                      }
                      data-testid={`status-${opp.id}`}
                    >
                      {opp.status}
                    </Badge>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={9} className="bg-muted/30">
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Market ID (A)</div>
                            <div className="font-mono text-sm">{opp.marketIdA}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Market ID (B)</div>
                            <div className="font-mono text-sm">{opp.marketIdB}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Days Until Event</div>
                            <div className="font-mono text-sm">
                              {opp.daysUntilEvent ?? "Unknown"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Reaction Time</div>
                            <div className="font-mono text-sm">
                              {opp.reactionTimeSeconds
                                ? `${opp.reactionTimeSeconds}s`
                                : "Pending"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
