import axios from "axios";
import * as crypto from "crypto";
import * as fs from "fs";
import { SportsMarket } from "../types/sports";

export class KalshiSportsFetcher {
  private readonly API_BASE = "https://api.elections.kalshi.com";
  private apiKey: string;
  private privateKeyPath: string;

  // Sports series tickers on Kalshi
  private readonly SPORTS_SERIES = [
    "KXNFL",      // NFL games
    "KXNBA",      // NBA games  
    "SUPERBOWL",  // Super Bowl
    "NBAPLAY",    // NBA Playoffs
    "NFLPLAY",    // NFL Playoffs
  ];

  constructor(apiKey: string, privateKeyPath: string) {
    this.apiKey = apiKey;
    this.privateKeyPath = privateKeyPath;
  }

  /**
   * Fetch all sports markets from Kalshi
   */
  async fetchSportsMarkets(): Promise<SportsMarket[]> {
    console.log("🏈 Fetching Kalshi sports markets...");

    const allMarkets: SportsMarket[] = [];

    for (const series of this.SPORTS_SERIES) {
      try {
        const markets = await this.fetchSeries(series);
        allMarkets.push(...markets);
      } catch (error) {
        console.error(`   Failed to fetch ${series}:`, error);
      }
    }

    console.log(`   ✅ Fetched ${allMarkets.length} Kalshi sports markets\n`);
    return allMarkets;
  }

  /**
   * Fetch markets for a specific series
   */
  private async fetchSeries(seriesTicker: string): Promise<SportsMarket[]> {
    const path = "/trade-api/v2/markets";
    const headers = this.generateAuthHeaders(path, "GET");

    const response = await axios.get(`${this.API_BASE}${path}`, {
      headers,
      params: {
        series_ticker: seriesTicker,
        status: "open",
        limit: 200
      }
    });

    const markets = response.data?.markets || [];
    
    return markets.map((market: any) => {
      // Combine title + subtitle for full event name
      const title = market.title || "";
      const subtitle = market.yes_sub_title || market.subtitle || "";
      const fullTitle = subtitle ? `${title} - ${subtitle}` : title;

      // Get mid price
      const yesBid = (market.yes_bid || 0) / 100;
      const yesAsk = (market.yes_ask || 0) / 100;
      const yesPrice = (yesBid + yesAsk) / 2;

      return {
        id: market.ticker || market.id,
        platform: "Kalshi" as const,
        title: fullTitle,
        sport: this.detectSport(fullTitle, seriesTicker),
        league: this.detectLeague(seriesTicker),
        eventDate: new Date(market.close_time || market.expiration_time),
        yesPrice: yesPrice,
        noPrice: 1 - yesPrice,
        volume: market.volume || 0,
        liquidity: market.open_interest || 0,
        status: "open" as const,
        metadata: market
      };
    });
  }

  /**
   * Generate Kalshi auth headers
   */
  private generateAuthHeaders(path: string, method: string = "GET"): Record<string, string> {
    try {
      const privateKeyPem = fs.readFileSync(this.privateKeyPath, 'utf8');
      const privateKey = crypto.createPrivateKey(privateKeyPem);

      const timestamp = Date.now();
      const timestampStr = timestamp.toString();
      const pathWithoutQuery = path.split('?')[0];
      const message = timestampStr + method + pathWithoutQuery;

      const signature = crypto.sign('sha256', Buffer.from(message), {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
      });

      return {
        "Content-Type": "application/json",
        "KALSHI-ACCESS-KEY": this.apiKey,
        "KALSHI-ACCESS-SIGNATURE": signature.toString('base64'),
        "KALSHI-ACCESS-TIMESTAMP": timestampStr,
      };
    } catch (error) {
      console.error("Error generating Kalshi auth headers:", error);
      return {};
    }
  }

  /**
   * Detect sport from title and series
   */
  private detectSport(title: string, series: string): SportsMarket["sport"] {
    const lower = title.toLowerCase();
    const seriesLower = series.toLowerCase();

    if (seriesLower.includes("nfl") || lower.includes("nfl")) return "NFL";
    if (seriesLower.includes("nba") || lower.includes("nba")) return "NBA";
    if (seriesLower.includes("mlb") || lower.includes("mlb")) return "MLB";
    if (seriesLower.includes("nhl") || lower.includes("nhl")) return "NHL";
    if (seriesLower.includes("soccer") || lower.includes("soccer")) return "Soccer";
    if (seriesLower.includes("ufc") || lower.includes("ufc")) return "UFC";
    if (seriesLower.includes("tennis") || lower.includes("tennis")) return "Tennis";

    return "Other";
  }

  /**
   * Detect league from series
   */
  private detectLeague(series: string): string | undefined {
    const upper = series.toUpperCase();

    if (upper.includes("NFL")) return "NFL";
    if (upper.includes("NBA")) return "NBA";
    if (upper.includes("MLB")) return "MLB";
    if (upper.includes("NHL")) return "NHL";
    if (upper.includes("UFC")) return "UFC";
    if (upper.includes("SUPERBOWL")) return "NFL";
    if (upper.includes("WORLDSERIES")) return "MLB";

    return undefined;
  }
}