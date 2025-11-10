import { ArbitrageOpportunity, ReactionTracking } from "../models";
import { NormalizedMarketData } from "./dataFetcher";

export class ReactionTracker {
  async trackActiveOpportunities(currentMarkets: NormalizedMarketData[]): Promise<void> {
    const activeOpportunities = await ArbitrageOpportunity.find({ status: "active" });

    for (const opportunity of activeOpportunities) {
      const marketA = currentMarkets.find(
        m => m.source === opportunity.platformA && m.marketId === opportunity.marketIdA
      );
      const marketB = currentMarkets.find(
        m => m.source === opportunity.platformB && m.marketId === opportunity.marketIdB
      );

      if (!marketA || !marketB) {
        continue;
      }

      const currentPriceGap = Math.abs(marketA.price - marketB.price);
      const initialPriceGap = Math.abs(opportunity.priceA - opportunity.priceB);

      await ReactionTracking.create({
        opportunityId: opportunity._id.toString(),
        platformA: opportunity.platformA,
        platformB: opportunity.platformB,
        priceA: marketA.price,
        priceB: marketB.price,
        priceGap: currentPriceGap,
        stillActive: currentPriceGap >= initialPriceGap * 0.3 ? "true" : "false",
        checkTimestamp: new Date(),
      });

      if (currentPriceGap < initialPriceGap * 0.3) {
        const detectedAt = opportunity.detectedAt;
        const now = new Date();
        const reactionTimeSeconds = Math.floor((now.getTime() - detectedAt.getTime()) / 1000);

        await ArbitrageOpportunity.findByIdAndUpdate(opportunity._id, {
          status: "closed",
          closedAt: now,
          reactionTimeSeconds,
        });

        console.log(`Arbitrage closed: ${opportunity.event} (lasted ${reactionTimeSeconds}s)`);
      }
    }
  }

  async getReactionTimeStats() {
    const closedOpportunities = await ArbitrageOpportunity.find({
      status: "closed",
      reactionTimeSeconds: { $exists: true, $ne: null },
    });

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
}
