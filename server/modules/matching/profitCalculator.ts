import { MatchedSportsPair, ArbitrageOpportunity } from "../types/sports";

export class ProfitCalculator {
  private readonly MIN_PROFIT_THRESHOLD = 0.5; // 0.5% minimum profit
  private readonly STANDARD_STAKE = 1000; // $1000 per side

  findOpportunities(matches: MatchedSportsPair[]): ArbitrageOpportunity[] {
    console.log("\n💰 Calculating arbitrage opportunities...");
    console.log(`   Analyzing ${matches.length} matched pairs...`);

    const opportunities: ArbitrageOpportunity[] = [];
    let strategy1Count = 0;
    let strategy2Count = 0;

    // Debug first 3 matches
    console.log(`\n   📊 Sample price analysis (first 3):`);
    matches.slice(0, 3).forEach((m, i) => {
      console.log(`\n   ${i + 1}. "${m.polyMarket.title.substring(0, 40)}..."`);
      console.log(`      Poly YES: ${m.polyMarket.yesPrice.toFixed(4)} | NO: ${m.polyMarket.noPrice.toFixed(4)}`);
      console.log(`      Kalshi YES: ${m.kalshiMarket.yesPrice.toFixed(4)} | NO: ${m.kalshiMarket.noPrice.toFixed(4)}`);
      
      const cost1 = m.polyMarket.yesPrice + m.kalshiMarket.noPrice;
      const cost2 = m.kalshiMarket.yesPrice + m.polyMarket.noPrice;
      
      console.log(`      Strategy 1 (Poly YES + Kalshi NO): Cost ${cost1.toFixed(4)} → Profit ${((1 - cost1) * 100).toFixed(2)}%`);
      console.log(`      Strategy 2 (Kalshi YES + Poly NO): Cost ${cost2.toFixed(4)} → Profit ${((1 - cost2) * 100).toFixed(2)}%`);
    });

    for (const match of matches) {
      // Strategy 1: Buy YES on Poly, NO on Kalshi
      const opp1 = this.calculateArbitrage(
        match,
        match.polyMarket.yesPrice,
        match.kalshiMarket.noPrice,
        "buy_poly_yes_kalshi_no"
      );

      if (opp1) {
        strategy1Count++;
        if (opp1.profitPercent >= this.MIN_PROFIT_THRESHOLD) {
          opportunities.push(opp1);
        }
      }

      // Strategy 2: Buy YES on Kalshi, NO on Poly
      const opp2 = this.calculateArbitrage(
        match,
        match.kalshiMarket.yesPrice,
        match.polyMarket.noPrice,
        "buy_kalshi_yes_poly_no"
      );

      if (opp2) {
        strategy2Count++;
        if (opp2.profitPercent >= this.MIN_PROFIT_THRESHOLD) {
          opportunities.push(opp2);
        }
      }
    }

    console.log(`\n   📈 Results:`);
    console.log(`      Strategy 1 valid: ${strategy1Count} (${opportunities.filter(o => o.strategy === 'buy_poly_yes_kalshi_no').length} profitable)`);
    console.log(`      Strategy 2 valid: ${strategy2Count} (${opportunities.filter(o => o.strategy === 'buy_kalshi_yes_poly_no').length} profitable)`);
    console.log(`      Min profit threshold: ${this.MIN_PROFIT_THRESHOLD}%`);

    // Sort by profit per day
    opportunities.sort((a, b) => b.profitPercentPerDay - a.profitPercentPerDay);

    console.log(`   ✅ Found ${opportunities.length} profitable opportunities\n`);
    return opportunities;
  }

  private calculateArbitrage(
    match: MatchedSportsPair,
    price1: number,
    price2: number,
    strategy: ArbitrageOpportunity["strategy"]
  ): ArbitrageOpportunity | null {
    const totalCost = price1 + price2;

    if (totalCost >= 1) {
      return null;
    }

    const profitPerDollar = (1 - totalCost) / totalCost;
    const profitPercent = profitPerDollar * 100;

    const now = new Date();
    const eventDate = match.polyMarket.eventDate;
    const daysUntilEvent = Math.max(1, Math.ceil(
      (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    ));

    const profitPercentPerDay = profitPercent / daysUntilEvent;

    const costSide1 = price1 * this.STANDARD_STAKE;
    const costSide2 = price2 * this.STANDARD_STAKE;
    const totalCostDollars = costSide1 + costSide2;
    const potentialProfit = this.STANDARD_STAKE - totalCostDollars;

    return {
      id: `${match.polyMarket.id}-${match.kalshiMarket.id}`,
      polyMarket: match.polyMarket,
      kalshiMarket: match.kalshiMarket,
      profitPercent,
      profitPercentPerDay,
      daysUntilEvent,
      detectedAt: new Date(),
      strategy,
      cost: totalCostDollars,
      potentialProfit,
      confidence: match.confidence
    };
  }

  calculateKellySize(
    probability: number,
    odds: number,
    bankroll: number
  ): number {
    const edge = probability - (1 / odds);
    const kellyFraction = edge / (odds - 1);
    return Math.max(0, Math.min(kellyFraction * bankroll, bankroll * 0.25));
  }

  calculateEV(
    winProbability: number,
    winAmount: number,
    loseProbability: number,
    loseAmount: number
  ): number {
    return (winProbability * winAmount) - (loseProbability * loseAmount);
  }
}