import { useQuery } from "@tanstack/react-query";
import { OpportunitiesTable } from "@/components/opportunities-table";
import { FilterPanel, FilterState } from "@/components/filter-panel";
import { ArbitrageOpportunity } from "@shared/schema";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function OpportunitiesPage() {
  const [filters, setFilters] = useState<FilterState>({
    minProfitPercent: 0,
    platforms: ["Polymarket", "Limitless", "Myriad", "Kalshi"],
  });
  const [searchQuery, setSearchQuery] = useState("");

  const { data: opportunities, isLoading } = useQuery<ArbitrageOpportunity[]>({
    queryKey: ["/api/opportunities"],
    refetchInterval: 5000,
  });

  const filteredOpportunities = opportunities?.filter((opp) => {
    const profitPercent = parseFloat(opp.profitPercent);
    const matchesProfit = profitPercent >= filters.minProfitPercent;
    const matchesPlatform =
      filters.platforms.includes(opp.platformA as any) ||
      filters.platforms.includes(opp.platformB as any);
    const matchesSearch =
      !searchQuery ||
      opp.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.platformA.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.platformB.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesProfit && matchesPlatform && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Active Opportunities</h1>
        <p className="text-muted-foreground">
          All detected arbitrage opportunities across platforms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by market, platform..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-opportunities"
            />
          </div>
          <FilterPanel onFilterChange={setFilters} />
        </div>

        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredOpportunities?.length ?? 0} of{" "}
              {opportunities?.length ?? 0} opportunities
            </div>
          </div>
          <OpportunitiesTable
            opportunities={filteredOpportunities ?? []}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
