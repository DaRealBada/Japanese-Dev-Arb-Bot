import axios from "axios";
import { SportsMarket, MatchedSportsPair } from "../types/sports";
import { TeamDictionary } from "./teamsDictionary";
import { GeminiSportsMatcher } from "../matching/geminiSportsMatcher";

export class DomeSportsFetcher {
  private readonly API_BASE = "https://api.domeapi.io/v1";
  private readonly apiKey: string;
  private teamDict: TeamDictionary;
  private geminiMatcher: GeminiSportsMatcher;

  constructor(apiKey: string, geminiApiKey: string) {
    this.apiKey = apiKey;
    this.teamDict = new TeamDictionary();
    this.geminiMatcher = new GeminiSportsMatcher(geminiApiKey);
  }

  async getMatchedSportsMarkets(): Promise<MatchedSportsPair[]> {
    console.log("\n🎯 Fetching sports markets from Dome API...");

    try {
      const [polyMarkets, kalshiMarkets] = await Promise.all([
        this.fetchPolymarketSports(),
        this.fetchKalshiSports()
      ]);

      console.log(`   Polymarket: ${polyMarkets.length} markets`);
      console.log(`   Kalshi: ${kalshiMarkets.length} markets`);

      if (polyMarkets.length === 0 || kalshiMarkets.length === 0) {
        console.log("   ⚠️ Not enough markets");
        return [];
      }

      const matches = this.directMatch(polyMarkets, kalshiMarkets);
      console.log(`   ✅ Final matches: ${matches.length}\n`);
      return matches;

    } catch (error) {
      console.error("❌ Error:", error);
      return [];
    }
  }

  private directMatch(
    polyMarkets: SportsMarket[],
    kalshiMarkets: SportsMarket[]
  ): MatchedSportsPair[] {
    console.log(`\n   🔍 Direct matching ${polyMarkets.length} × ${kalshiMarkets.length}...`);
    
    const matches: MatchedSportsPair[] = [];
    let dateFailures = 0;
    let teamFailures = 0;
    let sportFailures = 0;

    for (const poly of polyMarkets) {
      const polyResult = this.teamDict.extractTeams(poly.title);
      
      if (polyResult.abbrs.length !== 2 || !polyResult.sport) continue;
      const polyTeams = polyResult.abbrs;

      for (const kalshi of kalshiMarkets) {
        const polyDate = poly.eventDate.toISOString().split('T')[0];
        const kalshiDate = kalshi.eventDate.toISOString().split('T')[0];
        const daysDiff = Math.abs(
          (poly.eventDate.getTime() - kalshi.eventDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysDiff > 2) {
          dateFailures++;
          continue;
        }

        const kalshiResult = this.teamDict.extractTeams(kalshi.title);
        
        if (kalshiResult.abbrs.length !== 2 || !kalshiResult.sport) continue;
        const kalshiTeams = kalshiResult.abbrs;

        if (polyResult.sport !== kalshiResult.sport) {
          sportFailures++;
          continue;
        }

        const polySet = new Set(polyTeams.map(t => t.toUpperCase()));
        const kalshiSet = new Set(kalshiTeams.map(t => t.toUpperCase()));
        
        const bothMatch = polySet.size === kalshiSet.size && 
          [...polySet].every(t => kalshiSet.has(t));

        if (!bothMatch) {
          teamFailures++;
          continue;
        }

        console.log(`   ✅ [MATCH] [${polyTeams.join(',')}] ${polyResult.sport} on ${polyDate}`);
        console.log(`      Poly: "${poly.title}"`);
        console.log(`      Kalshi: "${kalshi.title}"`);

        matches.push({
          polyMarket: poly,
          kalshiMarket: kalshi,
          confidence: 1.0,
          reasoning: `Same teams (${polyTeams.join(', ')}) on same date`
        });
      }
    }

    console.log(`   📊 Stats: ${dateFailures} date fails, ${sportFailures} sport fails, ${teamFailures} team fails`);
    return matches;
  }

  private async fetchPolymarketSports(): Promise<SportsMarket[]> {
    try {
      const all: SportsMarket[] = [];
      const pages = 10;
      
      console.log(`   Fetching Polymarket (${pages} pages)...`);

      for (let p = 0; p < pages; p++) {
        if (p > 0) await new Promise(r => setTimeout(r, 2000));

        const res = await axios.get(`${this.API_BASE}/polymarket/markets`, {
          headers: { "Authorization": `Bearer ${this.apiKey}` },
          params: { limit: 100, offset: p * 100 }
        });

        const markets = res.data?.markets || res.data || [];
        const sports = markets
          .filter((m: any) => this.isSportsMarket(m))
          .map((m: any) => this.convertPolymarketToSportsMarket(m))
          .filter((m: SportsMarket | null) => m !== null) as SportsMarket[];

        all.push(...sports);
        console.log(`      Page ${p + 1}: ${sports.length} sports`);
      }

      return all;
    } catch (error) {
      console.error("❌ Polymarket fetch error:", error);
      return [];
    }
  }

  private async fetchKalshiSports(): Promise<SportsMarket[]> {
    try {
      const all: SportsMarket[] = [];
      const pages = 10;

      console.log(`   Fetching Kalshi (${pages} pages)...`);

      for (let p = 0; p < pages; p++) {
        await new Promise(r => setTimeout(r, 1100));

        const res = await axios.get(`${this.API_BASE}/kalshi/markets`, {
          headers: { "Authorization": `Bearer ${this.apiKey}` },
          params: { limit: 100, offset: p * 100 }
        });

        const markets = res.data?.markets || res.data || [];
        
        const sports = markets
          .filter((m: any) => this.isSportsMarket(m))
          .map((m: any) => this.convertKalshiToSportsMarket(m))
          .filter((m: SportsMarket | null) => m !== null) as SportsMarket[];

        all.push(...sports);
        console.log(`      Page ${p + 1}: ${sports.length} sports`);
      }

      return all;
    } catch (error) {
      console.error("❌ Kalshi fetch error:", error);
      return [];
    }
  }

  private convertPolymarketToSportsMarket(market: any): SportsMarket | null {
    try {
      const title = market.question || market.title || "";
      const teamResult = this.teamDict.extractTeams(title);
      const sport = teamResult.sport || this.detectSportFromKeywords(title);
      const yesPrice = parseFloat(market.last_price || market.price || market.outcome_prices?.[0] || 0);

      return {
        id: market.market_slug || market.slug || market.id,
        platform: "Polymarket",
        title,
        sport: sport === 'NBA' || sport === 'NFL' ? sport : "Other",
        league: sport === 'NBA' ? 'NBA' : sport === 'NFL' ? 'NFL' : this.detectLeague(title),
        eventDate: new Date(market.end_date || market.end_date_iso || Date.now()),
        yesPrice,
        noPrice: 1 - yesPrice,
        volume: parseFloat(market.volume || 0),
        liquidity: parseFloat(market.liquidity || 0),
        status: "open",
        metadata: market
      };
    } catch {
      return null;
    }
  }

  private convertKalshiToSportsMarket(market: any): SportsMarket | null {
    try {
      const title = market.title || "";
      const subtitle = market.yes_sub_title || market.subtitle || "";
      const fullTitle = subtitle ? `${title} - ${subtitle}` : title;
      const teamResult = this.teamDict.extractTeams(fullTitle);
      const sport = teamResult.sport || this.detectSportFromKeywords(fullTitle);
      const yesBid = (market.yes_bid || 0) / 100;
      const yesAsk = (market.yes_ask || 0) / 100;
      const yesPrice = (yesBid + yesAsk) / 2;

      let eventDate = new Date();
      const dateFields = [
        market.close_time,
        market.expiration_time, 
        market.close_date,
        market.end_date
      ];

      for (const field of dateFields) {
        if (field) {
          const parsed = new Date(field);
          if (parsed.getFullYear() > 2020) {
            eventDate = parsed;
            break;
          }
        }
      }

      return {
        id: market.ticker || market.id,
        platform: "Kalshi",
        title: fullTitle,
        sport: sport === 'NBA' || sport === 'NFL' ? sport : "Other",
        league: sport === 'NBA' ? 'NBA' : sport === 'NFL' ? 'NFL' : this.detectLeague(fullTitle),
        eventDate,
        yesPrice,
        noPrice: 1 - yesPrice,
        volume: parseFloat(market.volume || 0),
        liquidity: parseFloat(market.open_interest || 0),
        status: "open",
        metadata: market
      };
    } catch (err) {
      console.error(`   [KALSHI CONVERT ERROR] ${err}`);
      return null;
    }
  }

  private isSportsMarket(market: any): boolean {
    const text = (market.question || market.title || "").toLowerCase();
    const keywords = ["nfl", "nba", "mlb", "nhl", "ufc", "game", "match", "vs", " win", "playoff"];
    return keywords.some(k => text.includes(k));
  }

  private detectSportFromKeywords(title: string): SportsMarket["sport"] {
    const l = title.toLowerCase();
    if (l.includes("nfl") || (l.includes("football") && !l.includes("soccer"))) return "NFL";
    if (l.includes("nba") || l.includes("basketball")) return "NBA";
    if (l.includes("mlb") || l.includes("baseball")) return "MLB";
    if (l.includes("nhl") || l.includes("hockey")) return "NHL";
    if (l.includes("ufc") || l.includes("mma")) return "UFC";
    return "Other";
  }

  private detectLeague(title: string): string | undefined {
    const l = title.toLowerCase();
    if (l.includes("nfl")) return "NFL";
    if (l.includes("nba")) return "NBA";
    if (l.includes("mlb")) return "MLB";
    if (l.includes("nhl")) return "NHL";
    if (l.includes("ufc")) return "UFC";
    return undefined;
  }
}