// import { NormalizedMarketData } from "./dataFetcher";
// import { HybridMarketMatcher } from "./hybridMatcher";

// export interface ArbitrageOpportunity {
//   id?: string;
//   marketIdA: string;
//   marketIdB: string;
//   platformA: string;
//   platformB: string;
//   event: string;
//   priceA: number;
//   priceB: number;
//   profitPercent: number;
//   detectedAt?: Date;
// }

// export class ArbitrageDetector {
//   private matcher = new HybridMarketMatcher();

//   async detectOpportunities(markets: NormalizedMarketData[]): Promise<ArbitrageOpportunity[]> {
//     const polymarkets = markets.filter((m: NormalizedMarketData) => m.source === "Polymarket");
//     const kalshiMarkets = markets.filter((m: NormalizedMarketData) => m.source === "Kalshi");

//     const matchedGroups = await this.matcher.matchMarkets(polymarkets, kalshiMarkets);
//     const opportunities: ArbitrageOpportunity[] = [];

//     console.log(`\n📉 ANALYZING SPREADS for ${matchedGroups.size} verified pairs...`);

//     for (const [key, group] of matchedGroups) {
//       const poly = group.filter((m: NormalizedMarketData) => m.source === "Polymarket");
//       const kalshi = group.filter((m: NormalizedMarketData) => m.source === "Kalshi");

//       for (const p of poly) {
//         for (const k of kalshi) {
          
//           // Debug Log: Show what we are comparing
//           // console.log(`   Checking: ${key} | P:${p.price.toFixed(3)} vs K:${k.price.toFixed(3)}`);

//           // 1. LIQUIDITY FILTER (Relaxed slightly to 0.5% to see more data)
//           if (p.price > 0.99 || p.price < 0.005) continue;
//           if (k.price > 0.99 || k.price < 0.005) continue;

//           // 2. CALC SPREAD (Yes on A, No on B)
//           // Cost = PriceA + (1 - PriceB)
//           // Spread = 1 - Cost. (Positive spread = Profit)
//           const cost1 = p.price + (1 - k.price);
//           const spread1 = 1 - cost1;
          
//           if (spread1 > -0.05) { // Log anything close (within 5%)
//              const profit = ((1 - cost1) / cost1) * 100;
//              const isProfitable = profit > 0;
             
//              const icon = isProfitable ? "💰" : "📉";
//              console.log(`   ${icon} [${key}] Spread: ${(spread1 * 100).toFixed(2)}% | P:${p.price} / K:${k.price}`);

//              if (isProfitable) {
//                 opportunities.push({
//                    marketIdA: p.marketId,
//                    marketIdB: k.marketId,
//                    platformA: "Polymarket",
//                    platformB: "Kalshi",
//                    event: key,
//                    priceA: p.price,
//                    priceB: k.price,
//                    profitPercent: parseFloat(profit.toFixed(2)),
//                    detectedAt: new Date()
//                 });
//              }
//           }

//           // 3. INVERSE CALC (No on A, Yes on B)
//           const cost2 = (1 - p.price) + k.price;
//           const spread2 = 1 - cost2;

//           if (spread2 > -0.05) {
//             const profit = ((1 - cost2) / cost2) * 100;
//             const isProfitable = profit > 0;

//             const icon = isProfitable ? "💰" : "📉";
//             console.log(`   ${icon} [${key} INV] Spread: ${(spread2 * 100).toFixed(2)}% | P:${p.price} / K:${k.price}`);

//             if (isProfitable) {
//                opportunities.push({
//                   marketIdA: p.marketId,
//                   marketIdB: k.marketId,
//                   platformA: "Polymarket",
//                   platformB: "Kalshi",
//                   event: key + " (Inverse)",
//                   priceA: p.price,
//                   priceB: k.price,
//                   profitPercent: parseFloat(profit.toFixed(2)),
//                   detectedAt: new Date()
//                });
//             }
//           }
//         }
//       }
//     }

//     return opportunities;
//   }
// }