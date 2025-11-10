import { NormalizedMarketData } from "./dataFetcher";
import { ArbitrageOpportunity } from "../models";

export interface DetectedOpportunity {
  platformA: string;
  platformB: string;
  marketIdA: string;
  marketIdB: string;
  event: string;
  priceA: number;
  priceB: number;
  profitPercent: number;
  profitPercentPerDay?: number;
  daysUntilEvent?: number;
}

export class ArbitrageDetector {
  private readonly MIN_PROFIT_THRESHOLD = 0.5;

  private calculateProfit(priceA: number, priceB: number): number {
    const cost = Math.min(priceA, priceB) + (1 - Math.max(priceA, priceB));
    const return_value = 1;
    return ((return_value - cost) / cost) * 100;
  }

  private matchEvents(markets: NormalizedMarketData[]): Map<string, NormalizedMarketData[]> {
    const eventMap = new Map<string, NormalizedMarketData[]>();

    for (const market of markets) {
      const key = `${market.event.toLowerCase()}-${market.side.toLowerCase()}`;
      if (!eventMap.has(key)) {
        eventMap.set(key, []);
      }
      eventMap.get(key)!.push(market);
    }

    return eventMap;
  }

  async detectOpportunities(markets: NormalizedMarketData[]): Promise<DetectedOpportunity[]> {
    const opportunities: DetectedOpportunity[] = [];
    const matchedEvents = this.matchEvents(markets);

    for (const [eventKey, eventMarkets] of matchedEvents) {
      if (eventMarkets.length < 2) continue;

      for (let i = 0; i < eventMarkets.length; i++) {
        for (let j = i + 1; j < eventMarkets.length; j++) {
          const marketA = eventMarkets[i];
          const marketB = eventMarkets[j];

          if (marketA.source === marketB.source) continue;

          const profitPercent = this.calculateProfit(marketA.price, marketB.price);

          if (Math.abs(profitPercent) >= this.MIN_PROFIT_THRESHOLD) {
            const daysUntilEvent = this.estimateDaysUntilEvent(marketA.event);
            const profitPercentPerDay = daysUntilEvent 
              ? profitPercent / daysUntilEvent 
              : undefined;

            opportunities.push({
              platformA: marketA.source,
              platformB: marketB.source,
              marketIdA: marketA.marketId,
              marketIdB: marketB.marketId,
              event: marketA.event,
              priceA: marketA.price,
              priceB: marketB.price,
              profitPercent,
              profitPercentPerDay,
              daysUntilEvent,
            });
          }
        }
      }
    }

    return opportunities;
  }

  private estimateDaysUntilEvent(event: string): number | undefined {
    if (event.includes("2024")) {
      const endOf2024 = new Date("2024-12-31");
      const now = new Date();
      const diffTime = endOf2024.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    }
    
    return 30;
  }

  async saveOpportunities(opportunities: DetectedOpportunity[]): Promise<void> {
    for (const opp of opportunities) {
      const existing = await ArbitrageOpportunity.findOne({
        platformA: opp.platformA,
        platformB: opp.platformB,
        event: opp.event,
        status: "active",
      });

      if (!existing) {
        await ArbitrageOpportunity.create({
          ...opp,
          status: "active",
          detectedAt: new Date(),
        });
        console.log(`✅ New arbitrage detected: ${opp.event} (${opp.profitPercent.toFixed(2)}%)`);
      }
    }
  }
}
