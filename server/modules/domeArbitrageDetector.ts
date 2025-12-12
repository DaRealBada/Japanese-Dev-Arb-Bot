// import { DomeClient } from '@dome-api/sdk';

// export interface DomeArbitrageOpportunity {
//   polymarketMarket: any;
//   kalshiMarket: any;
//   polymarketPrice: number;
//   kalshiPrice: number;
//   profitPercent: number;
//   profitPercentPerDay?: number;
//   daysUntilEvent?: number;
//   confidence: number; // Based on Dome's matching score
// }

// export class DomeArbitrageDetector {
//   private dome: DomeClient;
//   private readonly MIN_PROFIT_THRESHOLD = 0.5;

//   constructor(apiKey: string) {
//     this.dome = new DomeClient({ apiKey });
//   }

//   /**
//    * Get all matching markets between Polymarket and Kalshi
//    */
//   async getMatchingMarkets(): Promise<any[]> {
//     try {
//       console.log('\n🔍 Fetching matching markets from Dome API...');
      
//       // Dome API has a matching endpoint that does the semantic matching for us!
//       const response = await this.dome.matching.getMatchingMarkets({
//         limit: 1000 // Get as many matches as possible
//       });
      
//       console.log(`   ✅ Found ${response.matches?.length || 0} matched market pairs`);
//       return response.matches || [];
      
//     } catch (error) {
//       console.error('Error fetching matching markets:', error);
//       return [];
//     }
//   }

//   /**
//    * Calculate profit for a matched pair
//    */
//   private calculateProfit(polyPrice: number, kalshiPrice: number): number {
//     // Buy YES on cheaper platform, NO on expensive platform
//     const profitAB = ((1 - (polyPrice + (1 - kalshiPrice))) / 
//                       (polyPrice + (1 - kalshiPrice))) * 100;
//     const profitBA = ((1 - (kalshiPrice + (1 - polyPrice))) / 
//                       (kalshiPrice + (1 - polyPrice))) * 100;
    
//     return Math.max(profitAB, profitBA);
//   }

//   /**
//    * Get current price for a Polymarket market
//    */
//   private async getPolymarketPrice(tokenId: string): Promise<number | null> {
//     try {
//       const priceData = await this.dome.polymarket.markets.getMarketPrice({
//         token_id: tokenId
//       });
//       return priceData.price || null;
//     } catch (error) {
//       console.error(`Failed to get Polymarket price for ${tokenId}:`, error);
//       return null;
//     }
//   }

//   /**
//    * Get current price for a Kalshi market
//    */
//   private async getKalshiPrice(marketTicker: string): Promise<number | null> {
//     try {
//       const marketData = await this.dome.kalshi.markets.getMarkets({
//         tickers: [marketTicker]
//       });
      
//       if (marketData.markets && marketData.markets.length > 0) {
//         const market = marketData.markets[0];
//         // Kalshi uses yes_bid/yes_ask, we'll use mid price
//         const yesBid = market.yes_bid || 0;
//         const yesAsk = market.yes_ask || 0;
//         return (yesBid + yesAsk) / 2 / 100; // Convert cents to decimal
//       }
//       return null;
//     } catch (error) {
//       console.error(`Failed to get Kalshi price for ${marketTicker}:`, error);
//       return null;
//     }
//   }

//   /**
//    * Enrich matched markets with current prices and calculate arbitrage
//    */
//   async detectOpportunities(): Promise<DomeArbitrageOpportunity[]> {
//     console.log('\n' + '='.repeat(70));
//     console.log('🚀 DOME API ARBITRAGE DETECTION');
//     console.log('='.repeat(70));

//     const matches = await this.getMatchingMarkets();
//     const opportunities: DomeArbitrageOpportunity[] = [];

//     console.log('\n💰 Checking prices for matched pairs...');

//     let checked = 0;
//     let foundArbs = 0;

//     // Process in batches to respect rate limits
//     const batchSize = 5;
//     for (let i = 0; i < matches.length; i += batchSize) {
//       const batch = matches.slice(i, i + batchSize);
      
//       await Promise.all(batch.map(async (match) => {
//         checked++;
        
//         try {
//           // Get current prices for both markets
//           const [polyPrice, kalshiPrice] = await Promise.all([
//             this.getPolymarketPrice(match.polymarket_token_id),
//             this.getKalshiPrice(match.kalshi_ticker)
//           ]);

//           if (polyPrice === null || kalshiPrice === null) {
//             return; // Skip if we can't get prices
//           }

//           // Sanity check: prices should be between 0.01 and 0.99
//           if (polyPrice <= 0.01 || polyPrice >= 0.99 || 
//               kalshiPrice <= 0.01 || kalshiPrice >= 0.99) {
//             return;
//           }

//           // Calculate profit
//           const profitPercent = this.calculateProfit(polyPrice, kalshiPrice);

//           // Check if it meets threshold
//           if (profitPercent >= this.MIN_PROFIT_THRESHOLD) {
//             foundArbs++;
            
//             // Calculate days until event (if end_date is available)
//             let daysUntilEvent = 30; // Default
//             if (match.end_date) {
//               const now = new Date();
//               const endDate = new Date(match.end_date);
//               daysUntilEvent = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
//             }

//             const profitPercentPerDay = profitPercent / Math.max(daysUntilEvent, 1);

//             console.log(`\n   💰 ARBITRAGE FOUND: ${match.event_name || 'Unknown Event'}`);
//             console.log(`      Profit: ${profitPercent.toFixed(2)}% (${profitPercentPerDay.toFixed(3)}%/day)`);
//             console.log(`      Polymarket: ${polyPrice.toFixed(3)} | Kalshi: ${kalshiPrice.toFixed(3)}`);
//             console.log(`      Confidence: ${(match.match_score * 100).toFixed(0)}%`);

//             opportunities.push({
//               polymarketMarket: match.polymarket_market,
//               kalshiMarket: match.kalshi_market,
//               polymarketPrice: polyPrice,
//               kalshiPrice: kalshiPrice,
//               profitPercent,
//               profitPercentPerDay,
//               daysUntilEvent,
//               confidence: match.match_score || 0.9
//             });
//           }
//         } catch (error) {
//           console.error(`Error processing match:`, error);
//         }
//       }));

//       console.log(`   Checked ${Math.min(checked, matches.length)}/${matches.length} pairs...`);

//       // Rate limit: wait 10 seconds between batches (free tier: 10 requests per 10 sec)
//       if (i + batchSize < matches.length) {
//         await new Promise(resolve => setTimeout(resolve, 10000));
//       }
//     }

//     console.log('\n' + '='.repeat(70));
//     console.log(`✅ DETECTION COMPLETE: ${foundArbs} opportunities found`);
//     console.log('='.repeat(70) + '\n');

//     // Sort by profit percentage
//     return opportunities.sort((a, b) => b.profitPercent - a.profitPercent);
//   }

//   /**
//    * Get historical trade data to analyze price trends
//    */
//   async getTradeHistory(tokenId: string, hoursBack: number = 24): Promise<any[]> {
//     try {
//       const now = Date.now();
//       const startTime = now - (hoursBack * 60 * 60 * 1000);

//       const trades = await this.dome.polymarket.markets.getTradeHistory({
//         token_id: tokenId,
//         start_time: Math.floor(startTime / 1000),
//         end_time: Math.floor(now / 1000)
//       });

//       return trades.trades || [];
//     } catch (error) {
//       console.error(`Failed to get trade history:`, error);
//       return [];
//     }
//   }

//   /**
//    * Get candlestick data for price analysis
//    */
//   async getCandlesticks(tokenId: string, interval: string = '1h'): Promise<any[]> {
//     try {
//       const candles = await this.dome.polymarket.markets.getCandlesticks({
//         token_id: tokenId,
//         interval: interval,
//         limit: 100
//       });

//       return candles.candlesticks || [];
//     } catch (error) {
//       console.error(`Failed to get candlesticks:`, error);
//       return [];
//     }
//   }
// }

// /**
//  * Main entry point
//  */
// export async function detectArbitrageWithDome(domeApiKey: string): Promise<DomeArbitrageOpportunity[]> {
//   const detector = new DomeArbitrageDetector(domeApiKey);
//   return await detector.detectOpportunities();
// }