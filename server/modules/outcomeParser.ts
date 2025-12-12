// import { NormalizedMarketData } from "./dataFetcher";

// export interface MarketOutcome {
//   type: "price_threshold" | "event_date" | "boolean_event" | "comparison" | "unknown";
//   asset?: string;
//   metric?: string;
//   operator?: ">=" | "<=" | ">" | "<" | "==";
//   threshold?: number;
//   currency?: string;
//   dateStart?: string;
//   dateEnd?: string;
//   rawText: string;
//   confidence: number;
// }

// export class OutcomeParser {
//   parseOutcome(text: string): MarketOutcome {
//     const lower = text.toLowerCase().trim();
    
//     const cryptoOutcome = this.parseCryptoPriceThreshold(lower, text);
//     if (cryptoOutcome.confidence > 0.7) return cryptoOutcome;
    
//     const stockOutcome = this.parseStockThreshold(lower, text);
//     if (stockOutcome.confidence > 0.7) return stockOutcome;
    
//     const macroOutcome = this.parseMacroEvent(lower, text);
//     if (macroOutcome.confidence > 0.6) return macroOutcome;
    
//     const dateOutcome = this.parseDateBasedEvent(lower, text);
//     if (dateOutcome.confidence > 0.6) return dateOutcome;
    
//     return { type: "unknown", rawText: text, confidence: 0.0 };
//   }

//   private parseCryptoPriceThreshold(lower: string, original: string): MarketOutcome {
//     const assets = [
//       { names: ["bitcoin", "btc"], symbol: "BTC" },
//       { names: ["ethereum", "eth"], symbol: "ETH" },
//       { names: ["solana", "sol"], symbol: "SOL" },
//       { names: ["dogecoin", "doge"], symbol: "DOGE" },
//       { names: ["xrp", "ripple"], symbol: "XRP" },
//     ];

//     let asset: string | undefined;
//     for (const a of assets) {
//       if (a.names.some(name => lower.includes(name))) {
//         asset = a.symbol;
//         break;
//       }
//     }
//     if (!asset) return { type: "unknown", rawText: original, confidence: 0.0 };

//     const pricePatterns = [
//       /\$?\s*(\d+)[,.]?(\d*)\s*k/i,
//       /\$\s*(\d+)[,]?(\d+)/i,
//       /(\d+)[,](\d+)/i,
//     ];

//     let threshold: number | undefined;
//     for (const pattern of pricePatterns) {
//       const match = lower.match(pattern);
//       if (match) {
//         const num1 = parseInt(match[1]);
//         const num2 = match[2] ? parseInt(match[2]) : 0;
        
//         if (lower.match(/k\b/)) {
//           threshold = num1 * 1000 + num2;
//         } else {
//           threshold = num1 * 1000 + num2;
//         }
//         break;
//       }
//     }

//     if (!threshold) return { type: "unknown", rawText: original, confidence: 0.0 };

//     let operator: ">=" | "<=" | ">" | "<" = ">=";
//     if (lower.includes("below") || lower.includes("under") || lower.includes("less than")) {
//       operator = "<=";
//     }

//     const dateEnd = this.extractEndDate(lower);
//     let metric = "max_price";
//     if (lower.includes("close") || lower.includes("closing")) {
//       metric = "close_price";
//     }

//     return {
//       type: "price_threshold",
//       asset,
//       metric,
//       operator,
//       threshold,
//       currency: "USD",
//       dateEnd,
//       rawText: original,
//       confidence: 0.9
//     };
//   }

//   private parseStockThreshold(lower: string, original: string): MarketOutcome {
//     const indices = [
//       { names: ["s&p 500", "s&p500", "spx", "sp500", "s&p"], symbol: "SPX" },
//       { names: ["dow", "djia", "dow jones"], symbol: "DJI" },
//       { names: ["nasdaq"], symbol: "IXIC" },
//     ];

//     let asset: string | undefined;
//     for (const idx of indices) {
//       if (idx.names.some(name => lower.includes(name))) {
//         asset = idx.symbol;
//         break;
//       }
//     }
//     if (!asset) return { type: "unknown", rawText: original, confidence: 0.0 };

//     const rangeMatch = lower.match(/between\s+(\d+)[,]?(\d*)\s+and\s+(\d+)[,]?(\d*)/);
//     if (rangeMatch) {
//       return { type: "unknown", rawText: original, confidence: 0.0 };
//     }

//     const thresholdPatterns = [
//       /(?:above|over|exceed)\s+(\d+)[,]?(\d*)/i,
//       /(?:below|under)\s+(\d+)[,]?(\d*)/i,
//       /(\d+)[,](\d+)/,
//     ];

//     let threshold: number | undefined;
//     let operator: ">=" | "<=" = ">=";

//     for (const pattern of thresholdPatterns) {
//       const match = lower.match(pattern);
//       if (match) {
//         threshold = parseInt(match[1] + (match[2] || ""));
        
//         if (lower.includes("below") || lower.includes("under")) {
//           operator = "<=";
//         }
//         break;
//       }
//     }

//     if (!threshold) return { type: "unknown", rawText: original, confidence: 0.0 };

//     const dateEnd = this.extractEndDate(lower);

//     return {
//       type: "price_threshold",
//       asset,
//       metric: "close_price",
//       operator,
//       threshold,
//       dateEnd,
//       rawText: original,
//       confidence: 0.85
//     };
//   }

//   private parseMacroEvent(lower: string, original: string): MarketOutcome {
//     const macroPatterns = [
//       { keywords: ["recession", "economic downturn"], event: "RECESSION" },
//       { keywords: ["fed rate hike", "rate hike", "interest rate increase"], event: "FED_RATE_HIKE" },
//       { keywords: ["fed rate cut", "rate cut", "interest rate cut", "emergency rate cut"], event: "FED_RATE_CUT" },
//       { keywords: ["tether insolvent", "usdt depeg", "tether collapse"], event: "TETHER_INSOLVENCY" },
//       { keywords: ["fed emergency", "emergency meeting"], event: "FED_EMERGENCY" },
//     ];

//     for (const pattern of macroPatterns) {
//       if (pattern.keywords.some(kw => lower.includes(kw))) {
//         const dateEnd = this.extractEndDate(lower);
        
//         return {
//           type: "boolean_event",
//           asset: pattern.event,
//           dateEnd,
//           rawText: original,
//           confidence: 0.85
//         };
//       }
//     }

//     return { type: "unknown", rawText: original, confidence: 0.0 };
//   }

//   private parseDateBasedEvent(lower: string, original: string): MarketOutcome {
//     const dateEnd = this.extractEndDate(lower);
    
//     if (dateEnd) {
//       return {
//         type: "event_date",
//         dateEnd,
//         rawText: original,
//         confidence: 0.6
//       };
//     }

//     return { type: "unknown", rawText: original, confidence: 0.0 };
//   }

//   private extractEndDate(text: string): string | undefined {
//     const monthMap: Record<string, string> = {
//       jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
//       jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
//     };

//     const patterns = [
//       /(?:by|before|until)\s+(\w+)\s+(\d{1,2}),?\s+(\d{4})/i,
//       /(?:by|before|until)\s+(\w+)\s+(\d{4})/i,
//       /(\d{4})-(\d{2})-(\d{2})/i,
//     ];

//     for (const pattern of patterns) {
//       const match = text.match(pattern);
//       if (match) {
//         if (match.length === 4 && match[3].length === 4) {
//           const month = monthMap[match[1].substring(0, 3).toLowerCase()];
//           const day = match[2].padStart(2, '0');
//           const year = match[3];
//           if (month) return `${year}-${month}-${day}T23:59:59Z`;
//         } else if (match.length === 3) {
//           const month = monthMap[match[1].substring(0, 3).toLowerCase()];
//           const year = match[2];
//           if (month) return `${year}-${month}-31T23:59:59Z`;
//         }
//       }
//     }

//     const yearMatch = text.match(/\b(202[4-9])\b/);
//     if (yearMatch) {
//       return `${yearMatch[1]}-12-31T23:59:59Z`;
//     }

//     return undefined;
//   }

//   areOutcomesEquivalent(a: MarketOutcome, b: MarketOutcome): boolean {
//     if (a.confidence < 0.7 || b.confidence < 0.7) return false;
//     if (a.type !== b.type) return false;

//     if (a.type === "price_threshold" && b.type === "price_threshold") {
//       if (a.asset !== b.asset) return false;
//       if (!a.threshold || !b.threshold) return false;
//       const diff = Math.abs(a.threshold - b.threshold) / a.threshold;
//       if (diff > 0.01) return false;
//       if (a.operator !== b.operator) return false;

//       if (a.dateEnd && b.dateEnd) {
//         const dateA = new Date(a.dateEnd).getTime();
//         const dateB = new Date(b.dateEnd).getTime();
//         const diffDays = Math.abs(dateA - dateB) / (1000 * 60 * 60 * 24);
//         if (diffDays > 7) return false;
//       }

//       return true;
//     }

//     if (a.type === "boolean_event" && b.type === "boolean_event") {
//       if (a.asset !== b.asset) return false;

//       if (a.dateEnd && b.dateEnd) {
//         const dateA = new Date(a.dateEnd).getTime();
//         const dateB = new Date(b.dateEnd).getTime();
//         const diffDays = Math.abs(dateA - dateB) / (1000 * 60 * 60 * 24);
//         if (diffDays > 30) return false;
//       }

//       return true;
//     }

//     return false;
//   }

//   getOutcomeKey(outcome: MarketOutcome): string {
//     if (outcome.type === "price_threshold") {
//       const dateKey = outcome.dateEnd ? outcome.dateEnd.substring(0, 7) : "no-date";
//       return `${outcome.asset}_${outcome.operator}_${outcome.threshold}_${dateKey}`;
//     }

//     if (outcome.type === "boolean_event") {
//       const dateKey = outcome.dateEnd ? outcome.dateEnd.substring(0, 7) : "no-date";
//       return `${outcome.asset}_${dateKey}`;
//     }

//     return `unknown_${outcome.rawText.substring(0, 30)}`;
//   }
// }