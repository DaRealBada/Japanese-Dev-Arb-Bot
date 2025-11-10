import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { PlatformStatus } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface PlatformStatusCardProps {
  status: PlatformStatus;
}

export function PlatformStatusCard({ status }: PlatformStatusCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold" data-testid={`platform-name-${status.platform.toLowerCase()}`}>
            {status.platform}
          </CardTitle>
          {status.isHealthy ? (
            <CheckCircle className="h-4 w-4 text-green-500" data-testid={`status-${status.platform.toLowerCase()}-healthy`} />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" data-testid={`status-${status.platform.toLowerCase()}-unhealthy`} />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Markets</span>
          <span className="font-mono font-semibold" data-testid={`markets-${status.platform.toLowerCase()}`}>
            {status.marketsMonitored}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Opportunities</span>
          <Badge variant="secondary" className="font-mono" data-testid={`opportunities-${status.platform.toLowerCase()}`}>
            {status.activeOpportunities}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
          <Clock className="h-3 w-3" />
          <span data-testid={`last-fetch-${status.platform.toLowerCase()}`}>
            {formatDistanceToNow(new Date(status.lastFetch), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
