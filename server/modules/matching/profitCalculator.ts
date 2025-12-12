import { MatchedSportsPair, ArbitrageOpportunity } from "../types/sports";

export class ProfitCalculator {
  private readonly MIN_PROFIT_THRESHOLD = 0.5; // 0.5% minimum profit
  private readonly STANDARD_STAKE = 1000; // $1000 per side

  /**
   * Find profitable arbitrage opportunities from matched pairs
   */
  findOpportunities(matches: MatchedSportsPair[]): ArbitrageOpportunity[] {
    console.log("\n💰 Calculating arbitrage opportunities...");

    const opportunities: ArbitrageOpportunity[] = [];

    for (const match of matches) {
      // Strategy 1: Buy YES on Poly, NO on Kalshi
      const opp1 = this.calculateArbitrage(
        match,
        match.polyMarket.yesPrice,
        match.kalshiMarket.noPrice,
        "buy_poly_yes_kalshi_no"
      );

      if (opp1 && opp1.profitPercent >= this.MIN_PROFIT_THRESHOLD) {
        opportunities.push(opp1);
      }

      // Strategy 2: Buy YES on Kalshi, NO on Poly
      const opp2 = this.calculateArbitrage(
        match,
        match.kalshiMarket.yesPrice,
        match.polyMarket.noPrice,
        "buy_kalshi_yes_poly_no"
      );

      if (opp2 && opp2.profitPercent >= this.MIN_PROFIT_THRESHOLD) {
        opportunities.push(opp2);
      }
    }

    // Sort by profit per day (prioritize near-term events)
    opportunities.sort((a, b) => b.profitPercentPerDay - a.profitPercentPerDay);

    console.log(`   ✅ Found ${opportunities.length} profitable opportunities\n`);
    return opportunities;
  }

  /**
   * Calculate arbitrage for a specific strategy
   */
  private calculateArbitrage(
    match: MatchedSportsPair,
    price1: number,
    price2: number,
    strategy: ArbitrageOpportunity["strategy"]
  ): ArbitrageOpportunity | null {
    // Total cost to buy both sides
    const totalCost = price1 + price2;

    // If total cost >= 1, no arbitrage possible
    if (totalCost >= 1) {
      return null;
    }

    // Profit is guaranteed payout ($1) minus cost
    const profitPerDollar = (1 - totalCost) / totalCost;
    const profitPercent = profitPerDollar * 100;

    // Calculate days until event
    const now = new Date();
    const eventDate = match.polyMarket.eventDate;
    const daysUntilEvent = Math.max(1, Math.ceil(
      (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    ));

    // Annualized return
    const profitPercentPerDay = profitPercent / daysUntilEvent;

    // Calculate dollar amounts
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

  /**
   * Calculate Kelly Criterion optimal bet size
   */
  calculateKellySize(
    probability: number,
    odds: number,
    bankroll: number
  ): number {
    const edge = probability - (1 / odds);
    const kellyFraction = edge / (odds - 1);
    return Math.max(0, Math.min(kellyFraction * bankroll, bankroll * 0.25));
  }

  /**
   * Calculate expected value
   */
  calculateEV(
    winProbability: number,
    winAmount: number,
    loseProbability: number,
    loseAmount: number
  ): number {
    return (winProbability * winAmount) - (loseProbability * loseAmount);
  }
}