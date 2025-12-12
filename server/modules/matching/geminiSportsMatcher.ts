import { GoogleGenerativeAI } from "@google/generative-ai";
import { SportsMarket, MatchedSportsPair } from "../types/sports";

interface EventGroup {
  eventKey: string;
  polyMarkets: SportsMarket[];
  kalshiMarkets: SportsMarket[];
  eventDate: Date;
  sport: string;
}

export class GeminiSportsMatcher {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json"
      }
    });
  }

  async findMatches(
    polyMarkets: SportsMarket[],
    kalshiMarkets: SportsMarket[]
  ): Promise<MatchedSportsPair[]> {
    console.log("\n🤖 Optimized AI Matching with Pre-Grouping...");
    
    // DEBUG: Show sample markets
    console.log("\n📋 SAMPLE POLYMARKET MARKETS (first 5):");
    polyMarkets.slice(0, 5).forEach(m => {
      console.log(`   "${m.title}" (${m.sport}, ${m.eventDate.toISOString().split('T')[0]})`);
    });
    
    console.log("\n📋 SAMPLE KALSHI MARKETS (first 5):");
    kalshiMarkets.slice(0, 5).forEach(m => {
      console.log(`   "${m.title}" (${m.sport}, ${m.eventDate.toISOString().split('T')[0]})`);
    });
    
    // STEP 1: Use AI to group markets by event (ONE AI CALL)
    const groups = await this.groupMarketsByEvent(polyMarkets, kalshiMarkets);
    
    console.log(`\n   ✅ AI grouped into ${groups.length} event groups`);
    
    if (groups.length === 0) {
      console.log("\n   ⚠️  No groups created - checking why...");
      return [];
    }
    
    // STEP 2: Match within each group using rules (NO AI)
    const matches: MatchedSportsPair[] = [];
    
    for (const group of groups) {
      console.log(`\n   🔍 Matching ${group.eventKey}...`);
      console.log(`      Poly: ${group.polyMarkets.length}, Kalshi: ${group.kalshiMarkets.length}`);
      
      const groupMatches = this.matchWithinGroup(group);
      matches.push(...groupMatches);
      
      console.log(`      → Found ${groupMatches.length} matches`);
    }
    
    console.log(`\n   ✅ Total matches: ${matches.length}\n`);
    return matches;
  }

  /**
   * STEP 1: Use AI to group all markets by event (single AI call)
   */
  private async groupMarketsByEvent(
    polyMarkets: SportsMarket[],
    kalshiMarkets: SportsMarket[]
  ): Promise<EventGroup[]> {
    console.log(`   🧠 Sending ${polyMarkets.length + kalshiMarkets.length} markets to AI for grouping...`);
    
    // Prepare market list for AI
    const allMarkets = [
      ...polyMarkets.map(m => ({ 
        id: `poly_${m.id}`, 
        title: m.title, 
        date: m.eventDate.toISOString().split('T')[0],
        sport: m.sport
      })),
      ...kalshiMarkets.map(m => ({ 
        id: `kalshi_${m.id}`, 
        title: m.title, 
        date: m.eventDate.toISOString().split('T')[0],
        sport: m.sport
      }))
    ];

    const prompt = `Group these sports betting markets by EVENT. Markets about the same game/match should be in the same group.

MARKETS:
${allMarkets.map(m => `${m.id}: "${m.title}" (${m.date})`).join('\n')}

RULES:
- Same teams/players + same date = same event
- Ignore outcome differences (e.g., "Team A wins" vs "Over 200 points" can be same event)
- Create unique event key like "lakers_celtics_2025-12-10"

Return JSON array of groups:
[
  {
    "eventKey": "lakers_celtics_2025-12-10",
    "sport": "NBA",
    "date": "2025-12-10",
    "marketIds": ["poly_123", "kalshi_456", "kalshi_789"]
  }
]`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log("\n   🤖 AI Response (first 500 chars):");
      console.log(text.substring(0, 500));
      
      // Parse JSON
      let parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) parsed = [parsed];
      
      console.log(`\n   📊 AI returned ${parsed.length} groups`);
      
      // Convert to EventGroup objects
      const groups: EventGroup[] = [];
      
      for (const group of parsed) {
        console.log(`\n   🔄 Processing group: ${group.eventKey}`);
        console.log(`      Market IDs: ${group.marketIds?.length || 0}`);
        
        const polyIds = group.marketIds.filter((id: string) => id.startsWith('poly_'));
        const kalshiIds = group.marketIds.filter((id: string) => id.startsWith('kalshi_'));
        
        console.log(`      Poly IDs: ${polyIds.length}, Kalshi IDs: ${kalshiIds.length}`);
        
        if (polyIds.length === 0 || kalshiIds.length === 0) {
          console.log(`      ⏭️  Skipping (missing platform)`);
          continue;
        }
        
        const polyGroup = polyMarkets.filter(m => polyIds.includes(`poly_${m.id}`));
        const kalshiGroup = kalshiMarkets.filter(m => kalshiIds.includes(`kalshi_${m.id}`));
        
        console.log(`      ✅ Matched: ${polyGroup.length} Poly + ${kalshiGroup.length} Kalshi`);
        
        groups.push({
          eventKey: group.eventKey,
          polyMarkets: polyGroup,
          kalshiMarkets: kalshiGroup,
          eventDate: new Date(group.date),
          sport: group.sport
        });
      }
      
      return groups;
      
    } catch (error: any) {
      console.error("\n   ❌ AI grouping failed:", error.message);
      console.error("   Stack:", error.stack);
      // Fallback: group by sport only
      return this.fallbackGrouping(polyMarkets, kalshiMarkets);
    }
  }

  /**
   * STEP 2: Match markets within a group using rules (no AI)
   */
  private matchWithinGroup(group: EventGroup): MatchedSportsPair[] {
    const matches: MatchedSportsPair[] = [];
    
    for (const polyMarket of group.polyMarkets) {
      for (const kalshiMarket of group.kalshiMarkets) {
        const similarity = this.calculateSimilarity(polyMarket.title, kalshiMarket.title);
        
        if (similarity > 0.6) {
          matches.push({
            polyMarket,
            kalshiMarket,
            confidence: similarity,
            reasoning: `Rule-based match (similarity: ${(similarity * 100).toFixed(0)}%)`
          });
          
          console.log(`         ✅ "${polyMarket.title}" ↔ "${kalshiMarket.title}"`);
          break; // One match per Poly market
        }
      }
    }
    
    return matches;
  }

  /**
   * Calculate string similarity (simple keyword overlap)
   */
  private calculateSimilarity(title1: string, title2: string): number {
    const normalize = (s: string) => s.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2); // Remove short words
    
    const words1 = new Set(normalize(title1));
    const words2 = new Set(normalize(title2));
    
    // Calculate Jaccard similarity
    const intersection = [...words1].filter(w => words2.has(w)).length;
    const union = words1.size + words2.size - intersection;
    
    return intersection / union;
  }

  /**
   * Fallback grouping if AI fails
   */
  private fallbackGrouping(
    polyMarkets: SportsMarket[],
    kalshiMarkets: SportsMarket[]
  ): EventGroup[] {
    const groups: EventGroup[] = [];
    const sportGroups = new Map<string, SportsMarket[]>();
    
    // Group by sport
    for (const m of polyMarkets) {
      if (!sportGroups.has(m.sport)) sportGroups.set(m.sport, []);
      sportGroups.get(m.sport)!.push(m);
    }
    
    for (const [sport, polyGroup] of sportGroups) {
      const kalshiGroup = kalshiMarkets.filter(m => m.sport === sport);
      
      if (kalshiGroup.length > 0) {
        groups.push({
          eventKey: sport,
          polyMarkets: polyGroup,
          kalshiMarkets: kalshiGroup,
          eventDate: new Date(),
          sport
        });
      }
    }
    
    return groups;
  }
}