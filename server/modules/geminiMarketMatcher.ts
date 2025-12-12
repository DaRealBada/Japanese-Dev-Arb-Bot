// server/modules/geminiMarketMatcher.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface StructuredMarket {
  asset?: string;           // "Bitcoin", "Ethereum", "S&P 500"
  eventType: string;        // "price_threshold" or "binary_event"
  threshold?: number;       // 150000 for "$150k"
  direction?: "above" | "below";
  timeframe?: string;       // "2025" or "2025-12-31"
  confidence: number;       // 0-1
  rawTitle: string;
}

interface MarketToParse {
  title: string;
  source: string;
}

export class GeminiMarketMatcher {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json"
      }
    });
  }

  async parseMarketsBatch(markets: MarketToParse[]): Promise<StructuredMarket[]> {
    if (markets.length === 0) return [];

    // Process in chunks of 20 to avoid token limits
    const CHUNK_SIZE = 50;
    
    const results: StructuredMarket[] = [];
    
    for (let i = 0; i < markets.length; i += CHUNK_SIZE) {
      const chunk = markets.slice(i, i + CHUNK_SIZE);
      const chunkResults = await this._parseChunk(chunk);
      results.push(...chunkResults);
    }
    
    return results;
  }


  private async _parseChunk(markets: MarketToParse[]): Promise<StructuredMarket[]> {
    console.log(`   📤 Parsing chunk of ${markets.length} markets...`);
    
    const prompt = `You are matching prediction markets across platforms. Learn from these examples:

  EXAMPLES:
  ✓ [Polymarket] "Will Bitcoin reach $150,000 by December 31, 2025?"
    [Kalshi] "How high will Bitcoin get this year? - $150,000 or above"
    → MATCH: asset="Bitcoin", threshold=150000, direction="above", timeframe="2025"

  ✓ [Polymarket] "Fed rate hike in 2025?"
    [Kalshi] "Powell confirmation"
    → MATCH: asset="Federal Reserve", eventType="binary_event", timeframe="2025"

  ✓ [Polymarket] "Will Bitcoin dip to $70,000 by December 31, 2025?"
    [Kalshi] "How low will Bitcoin get this year? - $70,000 or below"
    → MATCH: asset="Bitcoin", threshold=70000, direction="below", timeframe="2025"

  MARKETS TO PARSE:
  ${markets.map((m, i) => `${i + 1}. [${m.source}] "${m.title}"`).join('\n')}

  Extract for EACH:
  - asset: "Bitcoin"|"Ethereum"|"S&P 500"|"Federal Reserve"|"Trump"|etc
  - eventType: "price_threshold" OR "binary_event"
  - threshold: NUMBER ONLY (150000 not "$150k")
  - direction: "above" OR "below"
  - timeframe: "2025" or "2025-12-31"
  - confidence: 0.0-1.0

  CRITICAL RULES:
  1. "reach" = "get to" = "or above" = direction: "above"
  2. "dip" = "fall" = "or below" = direction: "below"
  3. Same asset + threshold + direction + year = SAME EVENT
  4. Ignore exact wording differences
  5. All $ amounts → numbers (no commas)

  Return JSON array:
  [
    {
      "asset": "Bitcoin",
      "eventType": "price_threshold",
      "threshold": 150000,
      "direction": "above",
      "timeframe": "2025",
      "confidence": 0.95,
      "rawTitle": "..."
    }
  ]`;

    try {
      console.log(`   ⏳ Calling Gemini API...`);
      
      const result = await Promise.race([
        this.model.generateContent(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gemini timeout after 45s')), 45000)
        )
      ]) as any;
      
      console.log(`   ✅ Gemini responded`);
      
      const response = await result.response;
      const text = response.text();
      
      console.log(`   📝 Got ${text.length} characters`);
      
      // Extract JSON (handle markdown wrapping)
      let jsonText = text;
      if (text.includes('```')) {
        const match = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
        if (match) jsonText = match[1];
      }
      
      const parsed = JSON.parse(jsonText);
      
      if (!Array.isArray(parsed)) {
        console.error("   ❌ Gemini returned non-array");
        return markets.map(m => this.createFallback(m.title));
      }
      
      console.log(`   ✅ Parsed ${parsed.length} markets`);
      
      // Add rawTitle and validate
      return parsed.map((item: any, i: number) => {
        const structured: StructuredMarket = {
          asset: item.asset,
          eventType: item.eventType || "binary_event",
          threshold: item.threshold,
          direction: item.direction,
          timeframe: item.timeframe,
          confidence: item.confidence || 0.5,
          rawTitle: markets[i].title
        };
        
        // Normalize threshold to number
        if (structured.threshold !== undefined) {
          if (typeof structured.threshold === 'string') {
            structured.threshold = parseFloat((structured.threshold as string).replace(/,/g, ''));
          }
        }
        
        return structured;
      });
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        console.error(`   ⏱️  Gemini timeout for chunk of ${markets.length} markets`);
      } else {
        console.error("   ❌ Gemini parsing error:", error);
      }
      return markets.map(m => this.createFallback(m.title));
    }
  }

  getGroupKey(structured: StructuredMarket): string {
    const parts: string[] = [];
    
    // Normalize asset name
    if (structured.asset) {
      let asset: string = structured.asset.toLowerCase().trim();
      // Normalize common variations
      if (asset === 'btc') asset = 'bitcoin';
      if (asset === 'eth') asset = 'ethereum';
      if (asset.includes('s&p') || asset.includes('s and p')) asset = 'sp500';
      parts.push(asset.replace(/\s+/g, '_'));
    }
    
    parts.push(structured.eventType);
    
    // For price thresholds, include threshold and direction
    if (structured.eventType === 'price_threshold' && structured.threshold) {
      parts.push(`${structured.direction}_${structured.threshold}`);
    }
    
    // Normalize timeframe to year
    if (structured.timeframe) {
      const year = structured.timeframe.match(/\d{4}/)?.[0];
      if (year) parts.push(year);
    }
    
    return parts.join('__');
  }

  private createFallback(title: string): StructuredMarket {
    return {
      eventType: "binary_event",
      confidence: 0.2,
      rawTitle: title
    };
  }

  areMarketsEquivalent(m1: StructuredMarket, m2: StructuredMarket): boolean {
    // Must have same asset (normalize)
    const normalizeAsset = (asset?: string): string | undefined => {
      if (!asset) return undefined;
      let normalized = asset.toLowerCase();
      if (normalized === 'btc') return 'bitcoin';
      if (normalized === 'eth') return 'ethereum';
      return normalized;
    };
    
    const asset1 = normalizeAsset(m1.asset);
    const asset2 = normalizeAsset(m2.asset);
    if (asset1 !== asset2) return false;
    
    // Must have same event type
    if (m1.eventType !== m2.eventType) return false;
    
    // For price thresholds, must match threshold and direction
    if (m1.eventType === "price_threshold") {
      if (m1.threshold !== m2.threshold) return false;
      if (m1.direction !== m2.direction) return false;
    }
    
    // Must have same year
    const year1 = m1.timeframe?.match(/\d{4}/)?.[0];
    const year2 = m2.timeframe?.match(/\d{4}/)?.[0];
    if (year1 && year2 && year1 !== year2) return false;
    
    return true;
  }
}