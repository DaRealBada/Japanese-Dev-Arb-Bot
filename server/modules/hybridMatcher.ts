// import { NormalizedMarketData } from "./dataFetcher";
// import { OutcomeParser } from "./outcomeParser"

// interface TopicCluster {
//   topic: string;
//   polymarkets: NormalizedMarketData[];
//   kalshiMarkets: NormalizedMarketData[];
// }

// export class HybridMarketMatcher {
//   private outcomeParser = new OutcomeParser();
//   private geminiApiKey: string;

//   constructor() {
//     this.geminiApiKey = process.env.GEMINI_API_KEY || "";
//   }

//   async matchMarkets(
//     polymarkets: NormalizedMarketData[],
//     kalshiMarkets: NormalizedMarketData[]
//   ): Promise<Map<string, NormalizedMarketData[]>> {
    
//     console.log(`\n📊 HYBRID MATCHING: AI-first (Full List), Parser-second`);
//     console.log(`   Polymarket: ${polymarkets.length} markets`);
//     console.log(`   Kalshi: ${kalshiMarkets.length} markets`);

//     const clusters = await this.clusterByTopicWithAI(polymarkets, kalshiMarkets);
    
//     console.log(`\n✅ Stage 1 (AI Clustering): Found ${clusters.length} topic clusters`);

//     const verifiedMatches = this.verifyMatchesWithParser(clusters);
    
//     console.log(`✅ Stage 2 (Parser Verification): ${verifiedMatches.size} verified pairs\n`);

//     return verifiedMatches;
//   }

//   private async clusterByTopicWithAI(
//     polymarkets: NormalizedMarketData[],
//     kalshiMarkets: NormalizedMarketData[]
//   ): Promise<TopicCluster[]> {
    
//     if (!this.geminiApiKey) {
//       console.warn("⚠️  Gemini API key not found, using fallback keyword matching");
//       return this.fallbackKeywordClustering(polymarkets, kalshiMarkets);
//     }

//     console.log(`\n🤖 Stage 1: AI Topic Clustering with Gemini (Sending ALL markets)...`);

//     // Minimized prompt keys to save output tokens and prevent cutoff
//     const prompt = this.buildClusteringPrompt(polymarkets, kalshiMarkets);

//     try {
//       const response = await fetch(
//         `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.geminiApiKey}`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             contents: [{ parts: [{ text: prompt }] }],
//             generationConfig: { 
//                 temperature: 0.1,
//                 // Using JSON mode enforces structure, but we still need to handle cutoffs
//                 responseMimeType: "application/json"
//             }
//           })
//         }
//       );

//       const data = await response.json();
//       const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
//       const clusters = this.parseGeminiResponse(responseText, polymarkets, kalshiMarkets);
//       console.log(`   AI identified ${clusters.length} topic clusters`);
      
//       return clusters;

//     } catch (error) {
//       console.error("   Gemini API error:", error);
//       console.log("   Falling back to keyword matching...");
//       return this.fallbackKeywordClustering(polymarkets, kalshiMarkets);
//     }
//   }

//   private buildClusteringPrompt(poly: NormalizedMarketData[], kalshi: NormalizedMarketData[]): string {
//     const polyList = poly.map((m: NormalizedMarketData, i: number) => `P${i}:"${m.event}"`).join("\n");
//     const kalshiList = kalshi.map((m: NormalizedMarketData, i: number) => `K${i}:"${m.event}"`).join("\n");

//     // We use extremely short keys in JSON to minimize token usage
//     // t = topic, p = polymarket_ids, k = kalshi_ids
//     return `You are a market matching engine. Group markets by EXACT SAME underlying topic.

// POLYMARKET:
// ${polyList}

// KALSHI:
// ${kalshiList}

// OUTPUT JSON:
// {
//   "c": [
//     { "t": "Bitcoin > 100k", "p": ["P0", "P5"], "k": ["K2"] }
//   ]
// }

// Rules:
// 1. ONLY output clusters with BOTH 'p' and 'k' ids.
// 2. Use SHORT keys: c=clusters, t=topic, p=poly_ids, k=kalshi_ids.
// 3. Be strict.`;
//   }

//   private parseGeminiResponse(
//     response: string,
//     polymarkets: NormalizedMarketData[],
//     kalshiMarkets: NormalizedMarketData[]
//   ): TopicCluster[] {
    
//     try {
//       let cleaned = response.replace(/```json|```/g, "").trim();
      
//       // === REPAIR MECHANISM ===
//       // If JSON is cut off (ends unexpectedly), try to close it.
//       if (!cleaned.endsWith("}")) {
//           // If it ends inside a list, string, or object, this is a rough heuristic
//           // to make it parsable. It discards the last broken entry.
//           const lastValidCluster = cleaned.lastIndexOf('}');
//           if (lastValidCluster > -1) {
//               cleaned = cleaned.substring(0, lastValidCluster + 1) + "]}";
//           }
//       }

//       const parsed = JSON.parse(cleaned);
//       const clusters: TopicCluster[] = [];

//       // Handle both long keys (if AI ignores instructions) and short keys
//       const rawClusters = parsed.clusters || parsed.c || [];

//       for (const cluster of rawClusters) {
//         const polyIds = cluster.polymarket_ids || cluster.p || [];
//         const kalshiIds = cluster.kalshi_ids || cluster.k || [];

//         const polyIndices = polyIds.map((id: string) => parseInt(id.replace("P", "")));
//         const kalshiIndices = kalshiIds.map((id: string) => parseInt(id.replace("K", "")));

//         const polyMarketsInCluster = polyIndices
//           .filter((i: number) => !isNaN(i) && i >= 0 && i < polymarkets.length)
//           .map((i: number) => polymarkets[i]);

//         const kalshiMarketsInCluster = kalshiIndices
//           .filter((i: number) => !isNaN(i) && i >= 0 && i < kalshiMarkets.length)
//           .map((i: number) => kalshiMarkets[i]);

//         if (polyMarketsInCluster.length > 0 && kalshiMarketsInCluster.length > 0) {
//           clusters.push({
//             topic: cluster.topic || cluster.t || "Unknown",
//             polymarkets: polyMarketsInCluster,
//             kalshiMarkets: kalshiMarketsInCluster
//           });
//         }
//       }

//       return clusters;

//     } catch (error) {
//       console.error("   Failed to parse Gemini response (Likely truncated):", error);
//       return [];
//     }
//   }

//   private fallbackKeywordClustering(
//     polymarkets: NormalizedMarketData[],
//     kalshiMarkets: NormalizedMarketData[]
//   ): TopicCluster[] {
    
//     const keywords = [
//       { topic: "Bitcoin", terms: ["bitcoin", "btc"] },
//       { topic: "Ethereum", terms: ["ethereum", "eth"] },
//       { topic: "Fed Rates", terms: ["fed rate", "rate cut", "fed cut"] },
//       { topic: "Tether", terms: ["tether", "usdt"] },
//     ];

//     const clusters: TopicCluster[] = [];

//     for (const { topic, terms } of keywords) {
//       const polyMatches = polymarkets.filter((m: NormalizedMarketData) =>
//         terms.some(term => m.event.toLowerCase().includes(term))
//       );

//       const kalshiMatches = kalshiMarkets.filter((m: NormalizedMarketData) =>
//         terms.some(term => m.event.toLowerCase().includes(term))
//       );

//       if (polyMatches.length > 0 && kalshiMatches.length > 0) {
//         clusters.push({ topic, polymarkets: polyMatches, kalshiMarkets: kalshiMatches });
//       }
//     }

//     return clusters;
//   }

//   private verifyMatchesWithParser(clusters: TopicCluster[]): Map<string, NormalizedMarketData[]> {
//     console.log(`\n🔍 Stage 2: Parser Verification...`);
//     const verifiedMatches = new Map<string, NormalizedMarketData[]>();

//     for (const cluster of clusters) {
//       // console.log(`\n   Verifying cluster: "${cluster.topic}"`);

//       const parsedPoly = cluster.polymarkets.map((m: NormalizedMarketData) => ({
//         market: m,
//         outcome: this.outcomeParser.parseOutcome(m.event)
//       }));

//       const parsedKalshi = cluster.kalshiMarkets.map((m: NormalizedMarketData) => ({
//         market: m,
//         outcome: this.outcomeParser.parseOutcome(m.event)
//       }));

//       for (const polyParsed of parsedPoly) {
//         for (const kalshiParsed of parsedKalshi) {
//           if (this.outcomeParser.areOutcomesEquivalent(polyParsed.outcome, kalshiParsed.outcome)) {
//             const key = this.outcomeParser.getOutcomeKey(polyParsed.outcome);
            
//             if (!verifiedMatches.has(key)) {
//               verifiedMatches.set(key, []);
//             }
//             const list = verifiedMatches.get(key)!;
//             if (!list.some((x: NormalizedMarketData) => x.marketId === polyParsed.market.marketId)) list.push(polyParsed.market);
//             if (!list.some((x: NormalizedMarketData) => x.marketId === kalshiParsed.market.marketId)) list.push(kalshiParsed.market);
            
//             console.log(`      ✅ VERIFIED MATCH: ${key}`);
//           }
//         }
//       }
//     }

//     return verifiedMatches;
//   }
// }