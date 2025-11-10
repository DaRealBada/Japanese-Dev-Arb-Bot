import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function ConnectionStatus() {
  const { data: stats, isError } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 10000,
  });

  const isConnected = !isError && stats !== undefined;

  return (
    <Badge
      variant={isConnected ? "default" : "destructive"}
      className="gap-1"
      data-testid="connection-status"
    >
      <Circle className="h-2 w-2 fill-current" data-testid="connection-indicator" />
      <span data-testid="connection-text">{isConnected ? "Connected" : "Disconnected"}</span>
    </Badge>
  );
}
