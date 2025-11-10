import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLATFORMS, Platform } from "@shared/schema";
import { Filter, X } from "lucide-react";
import { useState } from "react";

interface FilterPanelProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  minProfitPercent: number;
  platforms: Platform[];
}

export function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [minProfitPercent, setMinProfitPercent] = useState<number>(0);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([...PLATFORMS]);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const applyFilters = () => {
    onFilterChange({
      minProfitPercent,
      platforms: selectedPlatforms,
    });
  };

  const clearFilters = () => {
    setMinProfitPercent(0);
    setSelectedPlatforms([...PLATFORMS]);
    onFilterChange({
      minProfitPercent: 0,
      platforms: [...PLATFORMS],
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs"
            data-testid="button-clear-filters"
          >
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm" data-testid="label-min-profit">Min Profit %</Label>
            <span className="font-mono text-sm font-semibold" data-testid="value-min-profit">{minProfitPercent}%</span>
          </div>
          <Slider
            value={[minProfitPercent]}
            onValueChange={(values) => setMinProfitPercent(values[0])}
            max={20}
            step={0.5}
            data-testid="slider-min-profit"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm" data-testid="label-platforms">Platforms</Label>
          <div className="flex flex-wrap gap-2" data-testid="platform-filter-badges">
            {PLATFORMS.map((platform) => (
              <Badge
                key={platform}
                variant={selectedPlatforms.includes(platform) ? "default" : "outline"}
                className="cursor-pointer hover-elevate"
                onClick={() => togglePlatform(platform)}
                data-testid={`filter-platform-${platform.toLowerCase()}`}
              >
                {platform}
                {!selectedPlatforms.includes(platform) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        <Button
          onClick={applyFilters}
          className="w-full"
          data-testid="button-apply-filters"
        >
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
}
