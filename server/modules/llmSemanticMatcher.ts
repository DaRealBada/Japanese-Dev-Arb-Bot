// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { NormalizedMarketData } from "./dataFetcher";

// // Canonical representation of a market
// export interface CanonicalMarket {
//   marketId: string;
//   source: string;
//   originalEvent: string;
  
//   // Structured fields extracted by LLM
//   eventType: "price_threshold" | "binary_event" | "range" | "date_event" | "count";
//   subject: string; // "Bitcoin", "Federal Reserve", "Trump"
//   condition?: "above" | "below" | "equals" | "between";
//   threshold?: number;
//   thresholdUnit?: string; // "USD", "bps", "percent"
//   timeframe: string; // "2025", "Q1 2025", "by Dec 31 2025"
//   resolutionCriteria: string; // LLM-generated summary of how this resolves
  
//   // Original data
//   price: number;
//   timestamp: Date;
// }

// export interface SemanticMatch {
//   polyMarket: CanonicalMarket;
//   kalshiMarket: CanonicalMarket;
//   relationship: "equivalent" | "subset" | "superset" | "partial";
//   confidence: number; // 0-1, how confident LLM is in the match
//   reasoning: string; // LLM explanation
// }

// export class LLMSemanticMatcher {
//   private genAI: GoogleGenerativeAI;
//   private model: any;
//   private readonly MODEL_NAME = "gemini-2.0-flash-exp";
  
//   constructor(apiKey: string) {
//     this.genAI = new GoogleGenerativeAI(apiKey);
//     this.model = this.genAI.getGenerativeModel({ 
//       model: this.MODEL_NAME,
//       generationConfig: {
//         temperature: 0.1,
//         maxOutputTokens: 1000,
//       }
//     });
//   }

//   /**
//    * Parse a market into canonical form using LLM
//    */
//   async parseMarketToCanonical(market: NormalizedMarketData): Promise<CanonicalMarket | null> {
//     const prompt = `You are a prediction market parser. Extract structured information from this market.

// Market: "${market.event}"
// Platform: ${market.source}

// Extract and return ONLY a JSON object with these fields:
// {
//   "eventType": "price_threshold" | "binary_event" | "range" | "date_event" | "count",
//   "subject": string (the main asset/person/event, normalized),
//   "condition": "above" | "below" | "equals" | "between" (if applicable),
//   "threshold": number (if applicable),
//   "thresholdUnit": string (e.g., "USD", "bps", "percent"),
//   "timeframe": string (when this resolves),
//   "resolutionCriteria": string (concise description of resolution logic)
// }

// Examples:
// Input: "Will Bitcoin reach $130,000 by December 31, 2025?"
// Output: {"eventType":"price_threshold","subject":"Bitcoin","condition":"above","threshold":130000,"thresholdUnit":"USD","timeframe":"by Dec 31 2025","resolutionCriteria":"Resolves YES if Bitcoin price reaches $130k at any point before end of 2025"}

// Input: "How high will Bitcoin get this year? - $130,000 or above"
// Output: {"eventType":"price_threshold","subject":"Bitcoin","condition":"above","threshold":130000,"thresholdUnit":"USD","timeframe":"2025","resolutionCriteria":"Resolves YES if Bitcoin's maximum price in 2025 is $130k or higher"}

// Input: "Fed cuts rates by 50+ bps in 2025?"
// Output: {"eventType":"price_threshold","subject":"Federal Reserve interest rates","condition":"below","threshold":50,"thresholdUnit":"bps","timeframe":"2025","resolutionCriteria":"Resolves YES if Fed reduces rates by at least 50 basis points in 2025"}

// Now parse: "${market.event}"

// Return ONLY the JSON object, no markdown, no explanation.`;

//     try {
//       const result = await this.model.generateContent(prompt);
//       const response = await result.response;
//       const text = response.text();
      
//       // Clean up potential markdown formatting
//       let cleanText = text.trim();
//       cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
//       // Parse JSON response
//       const parsed = JSON.parse(cleanText);

//       return {
//         marketId: market.marketId,
//         source: market.source,
//         originalEvent: market.event,
//         eventType: parsed.eventType,
//         subject: parsed.subject,
//         condition: parsed.condition,
//         threshold: parsed.threshold,
//         thresholdUnit: parsed.thresholdUnit,
//         timeframe: parsed.timeframe,
//         resolutionCriteria: parsed.resolutionCriteria,
//         price: market.price,
//         timestamp: market.timestamp
//       };
//     } catch (error) {
//       console.error(`Failed to parse market: ${market.event}`, error);
//       return null;
//     }
//   }

//   /**
//    * Compare two canonical markets to determine if they're arbitrageable
//    */
//   async compareMarkets(
//     poly: CanonicalMarket,
//     kalshi: CanonicalMarket
//   ): Promise<SemanticMatch | null> {
//     const prompt = `You are comparing two prediction markets to determine if they represent the same underlying event (for arbitrage).

// POLYMARKET:
// - Event: "${poly.originalEvent}"
// - Subject: ${poly.subject}
// - Type: ${poly.eventType}
// - Condition: ${poly.condition || "N/A"}
// - Threshold: ${poly.threshold || "N/A"} ${poly.thresholdUnit || ""}
// - Timeframe: ${poly.timeframe}
// - Resolution: ${poly.resolutionCriteria}

// KALSHI:
// - Event: "${kalshi.originalEvent}"
// - Subject: ${kalshi.subject}
// - Type: ${kalshi.eventType}
// - Condition: ${kalshi.condition || "N/A"}
// - Threshold: ${kalshi.threshold || "N/A"} ${kalshi.thresholdUnit || ""}
// - Timeframe: ${kalshi.timeframe}
// - Resolution: ${kalshi.resolutionCriteria}

// Determine their logical relationship:
// - "equivalent": Both resolve the same way under all conditions (perfect arbitrage)
// - "subset": One implies the other (e.g., "BTC > $150k" implies "BTC > $130k")
// - "superset": Reverse of subset
// - "unrelated": Different events

// Return ONLY a JSON object:
// {
//   "relationship": "equivalent" | "subset" | "superset" | "unrelated",
//   "confidence": 0.0-1.0 (how confident are you?),
//   "reasoning": "brief explanation"
// }

// Critical rules:
// 1. Subjects must match (Bitcoin = Bitcoin, Fed rates = Fed rates)
// 2. Timeframes must overlap (both 2025 = match, "Q1 2025" vs "2025" = partial)
// 3. For price thresholds: exact threshold + direction must match for "equivalent"
// 4. Be conservative - when unsure, say "unrelated"

// Return ONLY the JSON, no markdown.`;

//     try {
//       const result = await this.model.generateContent(prompt);
//       const response = await result.response;
//       const text = response.text();
      
//       // Clean up potential markdown formatting
//       let cleanText = text.trim();
//       cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
//       const parsedResult = JSON.parse(cleanText);

//       // Only return matches with high confidence
//       if (parsedResult.relationship === "unrelated" || parsedResult.confidence < 0.7) {
//         return null;
//       }

//       return {
//         polyMarket: poly,
//         kalshiMarket: kalshi,
//         relationship: parsedResult.relationship,
//         confidence: parsedResult.confidence,
//         reasoning: parsedResult.reasoning
//       };
//     } catch (error) {
//       console.error("Failed to compare markets", error);
//       return null;
//     }
//   }

//   /**
//    * Batch process all markets - parse into canonical form
//    */
//   async batchParseMarkets(markets: NormalizedMarketData[]): Promise<CanonicalMarket[]> {
//     console.log(`\n🧠 Gemini: Parsing ${markets.length} markets into canonical form...`);
    
//     const canonical: CanonicalMarket[] = [];
//     const batchSize = 10;
    
//     for (let i = 0; i < markets.length; i += batchSize) {
//       const batch = markets.slice(i, i + batchSize);
//       const results = await Promise.all(
//         batch.map(m => this.parseMarketToCanonical(m))
//       );
      
//       canonical.push(...results.filter((r): r is CanonicalMarket => r !== null));
      
//       console.log(`   Processed ${Math.min(i + batchSize, markets.length)}/${markets.length}`);
      
//       if (i + batchSize < markets.length) {
//         await new Promise(resolve => setTimeout(resolve, 1000));
//       }
//     }
    
//     console.log(`   ✅ Parsed ${canonical.length} markets successfully\n`);
//     return canonical;
//   }

//   /**
//    * Find all semantic matches across platforms
//    */
//   async findSemanticMatches(
//     polyMarkets: CanonicalMarket[],
//     kalshiMarkets: CanonicalMarket[]
//   ): Promise<SemanticMatch[]> {
//     console.log(`\n🔍 Gemini: Finding semantic matches...`);
//     console.log(`   Comparing ${polyMarkets.length} Polymarket × ${kalshiMarkets.length} Kalshi markets`);
    
//     const matches: SemanticMatch[] = [];
//     const candidates: Array<[CanonicalMarket, CanonicalMarket]> = [];
    
//     for (const poly of polyMarkets) {
//       for (const kalshi of kalshiMarkets) {
//         const polySubject = poly.subject.toLowerCase();
//         const kalshiSubject = kalshi.subject.toLowerCase();
        
//         const hasOverlap = 
//           polySubject.includes(kalshiSubject) ||
//           kalshiSubject.includes(polySubject) ||
//           this.subjectsRelated(polySubject, kalshiSubject);
        
//         if (hasOverlap) {
//           candidates.push([poly, kalshi]);
//         }
//       }
//     }
    
//     console.log(`   Found ${candidates.length} candidate pairs`);
    
//     const batchSize = 5;
//     let compared = 0;
    
//     for (let i = 0; i < candidates.length; i += batchSize) {
//       const batch = candidates.slice(i, i + batchSize);
//       const results = await Promise.all(
//         batch.map(([p, k]) => this.compareMarkets(p, k))
//       );
      
//       matches.push(...results.filter((r): r is SemanticMatch => r !== null));
      
//       compared += batch.length;
//       console.log(`   Compared ${compared}/${candidates.length} candidates...`);
      
//       if (i + batchSize < candidates.length) {
//         await new Promise(resolve => setTimeout(resolve, 1000));
//       }
//     }
    
//     console.log(`   ✅ Found ${matches.length} semantic matches\n`);
//     return matches;
//   }

//   private subjectsRelated(a: string, b: string): boolean {
//     const aliases: Record<string, string[]> = {
//       "bitcoin": ["btc", "bitcoin"],
//       "ethereum": ["eth", "ethereum"],
//       "solana": ["sol", "solana"],
//       "xrp": ["xrp", "ripple"],
//       "federal reserve": ["fed", "federal reserve", "interest rates", "fomc"],
//       "trump": ["donald trump", "trump", "president trump"],
//       "recession": ["recession", "economic downturn", "gdp"],
//       "inflation": ["inflation", "cpi", "consumer price index"]
//     };
    
//     for (const [key, synonyms] of Object.entries(aliases)) {
//       if (synonyms.some(s => a.includes(s)) && synonyms.some(s => b.includes(s))) {
//         return true;
//       }
//     }
    
//     return false;
//   }
// }

// export async function detectArbitrageWithLLM(
//   markets: NormalizedMarketData[],
//   geminiApiKey: string
// ): Promise<SemanticMatch[]> {
//   const matcher = new LLMSemanticMatcher(geminiApiKey);
  
//   const polyMarkets = markets.filter(m => m.source === "Polymarket");
//   const kalshiMarkets = markets.filter(m => m.source === "Kalshi");
  
//   console.log(`\n📊 Processing ${polyMarkets.length} Polymarket + ${kalshiMarkets.length} Kalshi markets`);
  
//   const [canonicalPoly, canonicalKalshi] = await Promise.all([
//     matcher.batchParseMarkets(polyMarkets),
//     matcher.batchParseMarkets(kalshiMarkets)
//   ]);
  
//   const matches = await matcher.findSemanticMatches(canonicalPoly, canonicalKalshi);
  
//   const arbitrageMatches = matches.filter(match => {
//     const profitAB = ((1 - (match.polyMarket.price + (1 - match.kalshiMarket.price))) / 
//                       (match.polyMarket.price + (1 - match.kalshiMarket.price))) * 100;
//     const profitBA = ((1 - (match.kalshiMarket.price + (1 - match.polyMarket.price))) / 
//                       (match.kalshiMarket.price + (1 - match.polyMarket.price))) * 100;
    
//     return Math.max(profitAB, profitBA) > 0.5;
//   });
  
//   console.log(`\n💰 Found ${arbitrageMatches.length} profitable arbitrage opportunities`);
  
//   return arbitrageMatches;
// }