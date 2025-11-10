import { Badge } from "@/components/ui/badge";
import { PLATFORMS, Platform } from "@shared/schema";
import { useState } from "react";

interface PlatformFiltersProps {
  onChange?: (platforms: Platform[]) => void;
}

export function PlatformFilters({ onChange }: PlatformFiltersProps) {
  const [selected, setSelected] = useState<Platform[]>([...PLATFORMS]);

  const togglePlatform = (platform: Platform) => {
    const newSelection = selected.includes(platform)
      ? selected.filter((p) => p !== platform)
      : [...selected, platform];
    
    setSelected(newSelection);
    onChange?.(newSelection);
  };

  return (
    <div className="flex gap-2 items-center" data-testid="header-platform-filters">
      <span className="text-sm text-muted-foreground" data-testid="label-header-platforms">Platforms:</span>
      {PLATFORMS.map((platform) => (
        <Badge
          key={platform}
          variant={selected.includes(platform) ? "default" : "outline"}
          className="cursor-pointer hover-elevate text-xs"
          onClick={() => togglePlatform(platform)}
          data-testid={`header-filter-${platform.toLowerCase()}`}
        >
          {platform}
        </Badge>
      ))}
    </div>
  );
}
