import axios from "axios";
import { SportsMarket, MatchedSportsPair } from "../types/sports";

export class DomeSportsFetcher {
  private readonly API_BASE = "https://api.domeapi.io/v1";
  private readonly apiKey: string;
  private requestQueue: Promise<any> = Promise.resolve();
  private sheetsStorage: any | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  setSheetsStorage(sheets: any) {
    this.sheetsStorage = sheets;
  }

  private async rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
    this.requestQueue = this.requestQueue.then(async () => {
      await new Promise(r => setTimeout(r, 1200));
      return fn();
    });
    return this.requestQueue;
  }

  async getMatchedSportsMarkets(): Promise<MatchedSportsPair[]> {
    console.log("\n🎯 Fetching pre-matched markets from Dome API...");

    try {
      const today = new Date();
      const dates: string[] = [];
      
      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }

      const allMatches: MatchedSportsPair[] = [];

      console.log(`\n   📊 Fetching NBA matches...`);
      for (const date of dates) {
        const nbaMatches = await this.fetchMatchingMarketsBySport('nba', date);
        allMatches.push(...nbaMatches);
      }

      console.log(`\n   🏈 Fetching NFL matches...`);
      for (const date of dates) {
        const nflMatches = await this.fetchMatchingMarketsBySport('nfl', date);
        allMatches.push(...nflMatches);
      }

      console.log(`\n   ✅ Total pre-matched pairs: ${allMatches.length}\n`);
      return allMatches;

    } catch (error) {
      console.error("❌ Error:", error);
      return [];
    }
  }

  private async fetchMatchingMarketsBySport(
    sport: 'nba' | 'nfl',
    date: string
  ): Promise<MatchedSportsPair[]> {
    try {
      const res = await this.rateLimitedRequest(() =>
        axios.get(`${this.API_BASE}/matching-markets/sports/${sport}`, {
          headers: { "Authorization": `Bearer ${this.apiKey}` },
          params: { date }
        })
      );

      const marketsObject = res.data?.markets || {};
      const matchKeys = Object.keys(marketsObject);
      
      console.log(`      ${date}: ${matchKeys.length} ${sport.toUpperCase()} matches`);

      const matches: MatchedSportsPair[] = [];

      for (const key of matchKeys) {
        const platforms = marketsObject[key];
        
        const polyData = platforms.find((p: any) => p.platform === "POLYMARKET");
        const kalshiData = platforms.find((p: any) => p.platform === "KALSHI");

        if (!polyData || !kalshiData) continue;

        const polyMarket = await this.fetchPolymarketMarket(polyData.market_slug, polyData.token_ids[0]);
        if (!polyMarket) continue;

        const kalshiMarket = await this.fetchKalshiMarket(kalshiData.event_ticker, kalshiData.market_tickers[0]);
        if (!kalshiMarket) continue;

        matches.push({
          polyMarket,
          kalshiMarket,
          confidence: 1.0,
          reasoning: "Dome API pre-matched pair"
        });

        console.log(`         ✅ "${polyMarket.title.substring(0, 40)}..." ↔ "${kalshiMarket.title.substring(0, 40)}..."`);
        console.log(`            Poly: ${polyMarket.yesPrice.toFixed(3)} | Kalshi: ${kalshiMarket.yesPrice.toFixed(3)}`);

        if (this.sheetsStorage) {
          await this.sheetsStorage.saveMatchImmediately({
            polyMarket,
            kalshiMarket,
            confidence: 1.0,
            reasoning: "Dome API pre-matched pair"
          });
          console.log(`            💾 Saved to sheet`);
        }
      }

      console.log(`      → ${matches.length} valid pairs`);
      return matches;

    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`      ${date}: No matches`);
        return [];
      }
      console.error(`      ${date}: Error - ${error.message}`);
      return [];
    }
  }

  private async fetchPolymarketMarket(marketSlug: string, tokenId: string): Promise<SportsMarket | null> {
    try {
      const priceRes = await this.rateLimitedRequest(() =>
        axios.get(`${this.API_BASE}/polymarket/market-price/${tokenId}`, {
          headers: { "Authorization": `Bearer ${this.apiKey}` }
        })
      );

      const yesPrice = parseFloat(priceRes.data?.price || 0);

      const detailsRes = await this.rateLimitedRequest(() =>
        axios.get(`${this.API_BASE}/polymarket/markets`, {
          headers: { "Authorization": `Bearer ${this.apiKey}` },
          params: { market_slug: marketSlug, limit: 1 }
        })
      );

      const market = detailsRes.data?.markets?.[0];
      if (!market) return null;

      const title = market.question || market.title || "";

      return {
        id: market.market_slug || market.slug || market.id,
        platform: "Polymarket",
        title,
        sport: this.detectSport(marketSlug),
        league: this.detectSport(marketSlug),
        eventDate: new Date(market.end_date || market.end_date_iso || Date.now()),
        yesPrice,
        noPrice: 1 - yesPrice,
        volume: parseFloat(market.volume || 0),
        liquidity: parseFloat(market.liquidity || 0),
        status: "open",
        metadata: { ...market, token_id: tokenId }
      };
    } catch (error: any) {
      console.error(`❌ Poly fetch failed (${marketSlug}): ${error.response?.status || error.message}`);
      return null;
    }
  }

  private async fetchKalshiMarket(eventTicker: string, marketTicker: string): Promise<SportsMarket | null> {
    try {
      // Use Dome API trades endpoint to get most recent price
      const tradesRes = await this.rateLimitedRequest(() =>
        axios.get(`${this.API_BASE}/kalshi/trades`, {
          headers: { "Authorization": `Bearer ${this.apiKey}` },
          params: { ticker: marketTicker, limit: 1 }
        })
      );

      const trades = tradesRes.data?.trades || [];
      if (trades.length === 0) {
        console.log(`      ⚠️ No trades for ${marketTicker}`);
        return null;
      }

      const latestTrade = trades[0];
      const yesPrice = latestTrade.yes_price_dollars || (latestTrade.yes_price / 100);

      // Get market details from Dome API for title
      const marketRes = await this.rateLimitedRequest(() =>
        axios.get(`${this.API_BASE}/kalshi/markets`, {
          headers: { "Authorization": `Bearer ${this.apiKey}` },
          params: { market_ticker: marketTicker, limit: 1 }
        })
      );

      const market = marketRes.data?.markets?.[0];
      if (!market) return null;

      const title = market.title || "";
      const subtitle = market.yes_sub_title || market.subtitle || "";
      const fullTitle = subtitle ? `${title} - ${subtitle}` : title;

      return {
        id: market.ticker || market.id,
        platform: "Kalshi",
        title: fullTitle,
        sport: this.detectSport(eventTicker),
        league: this.detectSport(eventTicker),
        eventDate: new Date(market.close_time || market.expiration_time || Date.now()),
        yesPrice,
        noPrice: 1 - yesPrice,
        volume: parseFloat(market.volume || 0),
        liquidity: parseFloat(market.open_interest || 0),
        status: "open",
        metadata: { ...market, marketTicker }
      };
    } catch (error: any) {
      console.error(`❌ Kalshi fetch failed (${marketTicker}): ${error.response?.status || error.message}`);
      return null;
    }
  }

  private detectSport(identifier: string): "NBA" | "NFL" | "Other" {
    const lower = identifier.toLowerCase();
    if (lower.includes("nba")) return "NBA";
    if (lower.includes("nfl")) return "NFL";
    return "Other";
  }
}