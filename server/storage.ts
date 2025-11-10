interface MarketSnapshot {
  id: string;
  source: string;
  marketId: string;
  event: string;
  side: string;
  price: number;
  timestamp: Date;
  metadata?: any;
}

interface ArbitrageOpportunity {
  id: string;
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
  status: string;
  detectedAt: Date;
  closedAt?: Date;
  reactionTimeSeconds?: number;
}

interface ReactionTracking {
  id: string;
  opportunityId: string;
  checkTimestamp: Date;
  platformA: string;
  platformB: string;
  priceA: number;
  priceB: number;
  priceGap: number;
  stillActive: string;
}

export interface IStorage {
  getStats(): Promise<any>;
  getPlatformStatus(): Promise<any[]>;
  getOpportunities(filters?: any): Promise<ArbitrageOpportunity[]>;
  getRecentOpportunities(): Promise<ArbitrageOpportunity[]>;
  getClosedOpportunities(limit: number): Promise<ArbitrageOpportunity[]>;
  getProfitPerDayLeaderboard(limit: number): Promise<any[]>;
  getTotalProfitLeaderboard(limit: number): Promise<any[]>;
  getReactionTimeStats(): Promise<any>;
  saveMarketSnapshots(snapshots: any[]): Promise<void>;
  saveOpportunities(opportunities: any[]): Promise<void>;
  trackOpportunities(markets: any[]): Promise<void>;
  exportToCSV(): Promise<string>;
}

export class MemStorage implements IStorage {
  private marketSnapshots: MarketSnapshot[] = [];
  private opportunities: ArbitrageOpportunity[] = [];
  private reactionTracking: ReactionTracking[] = [];
  private nextId = 1;

  async getStats() {
    const activeOpportunities = this.opportunities.filter(o => o.status === "active").length;
    const closedWithReactionTime = this.opportunities.filter(
      o => o.status === "closed" && o.reactionTimeSeconds !== undefined
    );

    const avgReactionTime = closedWithReactionTime.length > 0
      ? closedWithReactionTime.reduce((sum, opp) => sum + (opp.reactionTimeSeconds || 0), 0) / closedWithReactionTime.length
      : 0;

    const totalProfitPercent = this.opportunities.reduce((sum, opp) => sum + opp.profitPercent, 0);
    const uniqueMarkets = new Set(this.marketSnapshots.map(m => m.marketId)).size;

    return {
      totalOpportunities: this.opportunities.length,
      activeOpportunities,
      avgReactionTime: Math.round(avgReactionTime),
      marketsMonitored: uniqueMarkets,
      totalProfitPercent: this.opportunities.length > 0 ? totalProfitPercent / this.opportunities.length : 0,
    };
  }

  async getPlatformStatus() {
    const platforms = ["Polymarket", "Limitless", "Myriad", "Kalshi"];
    
    return platforms.map(platform => {
      const platformMarkets = this.marketSnapshots.filter(m => m.source === platform);
      const uniqueMarkets = new Set(platformMarkets.map(m => m.marketId)).size;
      const lastSnapshot = platformMarkets.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      const activeOpportunities = this.opportunities.filter(
        o => (o.platformA === platform || o.platformB === platform) && o.status === "active"
      ).length;

      return {
        platform,
        marketsMonitored: uniqueMarkets,
        lastFetch: lastSnapshot?.timestamp.toISOString() || new Date().toISOString(),
        isHealthy: !!lastSnapshot,
        activeOpportunities,
      };
    });
  }

  async getOpportunities(filters?: any) {
    return this.opportunities
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, 100);
  }

  async getRecentOpportunities() {
    return this.opportunities
      .filter(o => o.status === "active")
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, 20);
  }

  async getClosedOpportunities(limit: number) {
    return this.opportunities
      .filter(o => o.status === "closed" && o.reactionTimeSeconds !== undefined)
      .sort((a, b) => (b.closedAt?.getTime() || 0) - (a.closedAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getProfitPerDayLeaderboard(limit: number) {
    return this.opportunities
      .filter(o => o.profitPercentPerDay !== undefined)
      .sort((a, b) => (b.profitPercentPerDay || 0) - (a.profitPercentPerDay || 0))
      .slice(0, limit)
      .map((opp, index) => ({
        id: opp.id,
        rank: index + 1,
        event: opp.event,
        platformA: opp.platformA,
        platformB: opp.platformB,
        profitPercent: opp.profitPercent,
        profitPercentPerDay: opp.profitPercentPerDay,
        daysUntilEvent: opp.daysUntilEvent,
        detectedAt: opp.detectedAt.toISOString(),
        status: opp.status,
      }));
  }

  async getTotalProfitLeaderboard(limit: number) {
    return this.opportunities
      .sort((a, b) => b.profitPercent - a.profitPercent)
      .slice(0, limit)
      .map((opp, index) => ({
        id: opp.id,
        rank: index + 1,
        event: opp.event,
        platformA: opp.platformA,
        platformB: opp.platformB,
        profitPercent: opp.profitPercent,
        profitPercentPerDay: opp.profitPercentPerDay,
        daysUntilEvent: opp.daysUntilEvent,
        detectedAt: opp.detectedAt.toISOString(),
        status: opp.status,
      }));
  }

  async getReactionTimeStats() {
    const closedOpportunities = this.opportunities.filter(
      o => o.status === "closed" && o.reactionTimeSeconds !== undefined
    );

    if (closedOpportunities.length === 0) {
      return {
        average: 0,
        fastest: 0,
        slowest: 0,
        distribution: [],
      };
    }

    const times = closedOpportunities.map(o => o.reactionTimeSeconds!);
    const average = times.reduce((sum, t) => sum + t, 0) / times.length;
    const fastest = Math.min(...times);
    const slowest = Math.max(...times);

    const distribution = [
      { range: "0-30s", count: times.filter(t => t <= 30).length },
      { range: "31-60s", count: times.filter(t => t > 30 && t <= 60).length },
      { range: "1-5min", count: times.filter(t => t > 60 && t <= 300).length },
      { range: "5-15min", count: times.filter(t => t > 300 && t <= 900).length },
      { range: "15min+", count: times.filter(t => t > 900).length },
    ];

    return { average, fastest, slowest, distribution };
  }

  async saveMarketSnapshots(snapshots: any[]) {
    const newSnapshots = snapshots.map(s => ({
      id: String(this.nextId++),
      ...s,
    }));
    this.marketSnapshots.push(...newSnapshots);

    const cutoff = Date.now() - 60 * 60 * 1000;
    this.marketSnapshots = this.marketSnapshots.filter(s => s.timestamp.getTime() > cutoff);
  }

  async saveOpportunities(opportunities: any[]) {
    for (const opp of opportunities) {
      const existing = this.opportunities.find(
        o =>
          o.platformA === opp.platformA &&
          o.platformB === opp.platformB &&
          o.event === opp.event &&
          o.status === "active"
      );

      if (!existing) {
        this.opportunities.push({
          id: String(this.nextId++),
          ...opp,
          detectedAt: new Date(),
          status: "active",
        });
        console.log(`New arbitrage detected: ${opp.event} (${opp.profitPercent.toFixed(2)}%)`);
      }
    }
  }

  async trackOpportunities(markets: any[]) {
    const activeOpportunities = this.opportunities.filter(o => o.status === "active");

    for (const opportunity of activeOpportunities) {
      const marketA = markets.find(
        m => m.source === opportunity.platformA && m.marketId === opportunity.marketIdA
      );
      const marketB = markets.find(
        m => m.source === opportunity.platformB && m.marketId === opportunity.marketIdB
      );

      if (!marketA || !marketB) continue;

      const currentPriceGap = Math.abs(marketA.price - marketB.price);
      const initialPriceGap = Math.abs(opportunity.priceA - opportunity.priceB);

      this.reactionTracking.push({
        id: String(this.nextId++),
        opportunityId: opportunity.id,
        platformA: opportunity.platformA,
        platformB: opportunity.platformB,
        priceA: marketA.price,
        priceB: marketB.price,
        priceGap: currentPriceGap,
        stillActive: currentPriceGap >= initialPriceGap * 0.3 ? "true" : "false",
        checkTimestamp: new Date(),
      });

      if (currentPriceGap < initialPriceGap * 0.3) {
        const reactionTimeSeconds = Math.floor((Date.now() - opportunity.detectedAt.getTime()) / 1000);
        
        const index = this.opportunities.findIndex(o => o.id === opportunity.id);
        if (index !== -1) {
          this.opportunities[index] = {
            ...this.opportunities[index],
            status: "closed",
            closedAt: new Date(),
            reactionTimeSeconds,
          };
        }

        console.log(`Arbitrage closed: ${opportunity.event} (lasted ${reactionTimeSeconds}s)`);
      }
    }
  }

  async exportToCSV(): Promise<string> {
    return "/tmp/leaderboard-export.csv";
  }
}

export const storage = new MemStorage();
