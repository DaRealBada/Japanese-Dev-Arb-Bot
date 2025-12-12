// Shared TypeScript interfaces for sports arbitrage

export interface SportsMarket {
  id: string;
  platform: "Polymarket" | "Kalshi";
  title: string;
  sport: "NFL" | "NBA" | "MLB" | "NHL" | "Soccer" | "UFC" | "Tennis" | "Other";
  league?: string;
  eventDate: Date;
  yesPrice: number; // 0-1 decimal
  noPrice: number;
  volume?: number;
  liquidity?: number;
  status: "open" | "closed" | "settled";
  metadata?: any;
}

export interface MatchedSportsPair {
  polyMarket: SportsMarket;
  kalshiMarket: SportsMarket;
  confidence: number; // 0-1, how confident AI is in the match
  reasoning: string; // AI explanation
}

export interface ArbitrageOpportunity {
  id: string;
  polyMarket: SportsMarket;
  kalshiMarket: SportsMarket;
  profitPercent: number;
  profitPercentPerDay: number;
  daysUntilEvent: number;
  detectedAt: Date;
  strategy: "buy_poly_yes_kalshi_no" | "buy_kalshi_yes_poly_no";
  cost: number; // Total cost to execute
  potentialProfit: number; // In dollars
  confidence: number;
}

export interface PriceUpdate {
  marketId: string;
  platform: "Polymarket" | "Kalshi";
  yesPrice: number;
  noPrice: number;
  timestamp: Date;
}