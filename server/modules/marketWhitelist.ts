// // Fast rule-based matcher for common patterns
// export interface ParsedMarket {
//   asset: string;
//   threshold?: number;
//   direction?: "above" | "below";
//   year?: string;
//   type: "price_threshold" | "binary";
// }

// // Whitelist for exact threshold matches
// export interface WhitelistedPair {
//   id: string;
//   name: string;
//   asset: string;
//   threshold?: number;
//   direction?: "above" | "below";
//   year?: number;
// }

// export const WHITELISTED_PAIRS: WhitelistedPair[] = [
//   // ===== BITCOIN THRESHOLDS =====
//   { id: "BTC_130K", name: "Bitcoin $130,000", asset: "Bitcoin", threshold: 130000, direction: "above", year: 2025 },
//   { id: "BTC_140K", name: "Bitcoin $140,000", asset: "Bitcoin", threshold: 140000, direction: "above", year: 2025 },
//   { id: "BTC_150K", name: "Bitcoin $150,000", asset: "Bitcoin", threshold: 150000, direction: "above", year: 2025 },
//   { id: "BTC_160K", name: "Bitcoin $160,000", asset: "Bitcoin", threshold: 160000, direction: "above", year: 2025 },
//   { id: "BTC_170K", name: "Bitcoin $170,000", asset: "Bitcoin", threshold: 170000, direction: "above", year: 2025 },
//   { id: "BTC_180K", name: "Bitcoin $180,000", asset: "Bitcoin", threshold: 180000, direction: "above", year: 2025 },
//   { id: "BTC_190K", name: "Bitcoin $190,000", asset: "Bitcoin", threshold: 190000, direction: "above", year: 2025 },
//   { id: "BTC_200K", name: "Bitcoin $200,000", asset: "Bitcoin", threshold: 200000, direction: "above", year: 2025 },
//   { id: "BTC_225K", name: "Bitcoin $225,000", asset: "Bitcoin", threshold: 225000, direction: "above", year: 2025 },
//   { id: "BTC_250K", name: "Bitcoin $250,000", asset: "Bitcoin", threshold: 250000, direction: "above", year: 2025 },
//   { id: "BTC_300K", name: "Bitcoin $300,000", asset: "Bitcoin", threshold: 300000, direction: "above", year: 2025 },
//   { id: "BTC_500K", name: "Bitcoin $500,000", asset: "Bitcoin", threshold: 500000, direction: "above", year: 2025 },
//   { id: "BTC_70K_DIP", name: "Bitcoin $70,000", asset: "Bitcoin", threshold: 70000, direction: "below", year: 2025 },
//   { id: "BTC_50K_DIP", name: "Bitcoin $50,000", asset: "Bitcoin", threshold: 50000, direction: "below", year: 2025 },
//   { id: "BTC_20K_DIP", name: "Bitcoin $20,000", asset: "Bitcoin", threshold: 20000, direction: "below", year: 2025 },

//   // ===== ETHEREUM THRESHOLDS =====
//   { id: "ETH_6750", name: "Ethereum $6,750", asset: "Ethereum", threshold: 6750, direction: "above", year: 2025 },
//   { id: "ETH_7000", name: "Ethereum $7,000", asset: "Ethereum", threshold: 7000, direction: "above", year: 2025 },

//   // ===== SOLANA THRESHOLDS =====
//   { id: "SOL_210", name: "Solana $210", asset: "Solana", threshold: 210, direction: "above", year: 2025 },
//   { id: "SOL_220", name: "Solana $220", asset: "Solana", threshold: 220, direction: "above", year: 2025 },
//   { id: "SOL_230", name: "Solana $230", asset: "Solana", threshold: 230, direction: "above", year: 2025 },
//   { id: "SOL_240", name: "Solana $240", asset: "Solana", threshold: 240, direction: "above", year: 2025 },
//   { id: "SOL_250", name: "Solana $250", asset: "Solana", threshold: 250, direction: "above", year: 2025 },
//   { id: "SOL_260", name: "Solana $260", asset: "Solana", threshold: 260, direction: "above", year: 2025 },
//   { id: "SOL_270", name: "Solana $270", asset: "Solana", threshold: 270, direction: "above", year: 2025 },
//   { id: "SOL_300", name: "Solana $300", asset: "Solana", threshold: 300, direction: "above", year: 2025 },
//   { id: "SOL_310", name: "Solana $310", asset: "Solana", threshold: 310, direction: "above", year: 2025 },
//   { id: "SOL_400", name: "Solana $400", asset: "Solana", threshold: 400, direction: "above", year: 2025 },
//   { id: "SOL_500", name: "Solana $500", asset: "Solana", threshold: 500, direction: "above", year: 2025 },
//   { id: "SOL_580", name: "Solana $580", asset: "Solana", threshold: 580, direction: "above", year: 2025 },
  
//   // ===== SHIBA INU THRESHOLDS =====
//   { id: "SHIB_0_000025", name: "Shiba Inu $0.000025", asset: "Shiba Inu", threshold: 0.000025, direction: "above", year: 2025 },
//   { id: "SHIB_0_00003", name: "Shiba Inu $0.00003", asset: "Shiba Inu", threshold: 0.00003, direction: "above", year: 2025 },
  
//   // ===== XRP/RIPPLE THRESHOLDS =====
//   { id: "XRP_3_75", name: "XRP $3.75", asset: "XRP", threshold: 3.75, direction: "above", year: 2025 },
//   { id: "XRP_3_84_ATH", name: "XRP $3.84 ATH", asset: "XRP", threshold: 3.84, direction: "above", year: 2025 },
//   { id: "XRP_4", name: "XRP $4", asset: "XRP", threshold: 4, direction: "above", year: 2025 },
  
//   // ===== XLM/STELLAR THRESHOLDS =====
//   // Add when you find Kalshi markets for XLM
  
//   // ===== LITECOIN THRESHOLDS =====
//   // Add when you find Kalshi markets for LTC
  
//   // ===== CHAINLINK THRESHOLDS =====
//   // Add when you find Kalshi markets for LINK
  
//   // ===== POLKADOT THRESHOLDS =====
//   // Add when you find Kalshi markets for DOT
  
//   // ===== BITCOIN CASH THRESHOLDS =====
//   // Add when you find Kalshi markets for BCH
  
//   // ===== AVALANCHE THRESHOLDS =====
//   // Add when you find Kalshi markets for AVAX

//   // ===== BINARY EVENTS (No thresholds) =====
//   { id: "USDT_DEPEG_2025", name: "USDT depeg 2025", asset: "Tether", year: 2025 },
//   { id: "CHINA_UNBAN_BTC", name: "China legalize Bitcoin 2025", asset: "Bitcoin", year: 2025 },
//   { id: "SOL_FLIP_ETH", name: "Solana flip Ethereum 2025", asset: "Solana", year: 2025 },
//   { id: "ETH_FLIPPED", name: "Ethereum flipped 2025", asset: "Ethereum", year: 2025 },
// ];

// export class FastMatcher {
//   // Parse common patterns WITHOUT AI
//   parseMarket(title: string, source: string): ParsedMarket | null {
//     const lower = title.toLowerCase();
    
//     // ==== PRICE THRESHOLD PATTERNS ====
//     const pricePattern = /(\$[\d,]+|[\d,]+k)/i;
//     const priceMatch = title.match(pricePattern);
    
//     if (priceMatch) {
//       // Extract asset - ALL CRYPTO + STOCKS
//       let asset = "";
//       // Major Crypto
//       if (lower.includes("bitcoin") || lower.includes("btc")) asset = "Bitcoin";
//       else if (lower.includes("ethereum") || lower.includes("eth")) asset = "Ethereum";
//       else if (lower.includes("solana") || lower.includes("sol")) asset = "Solana";
//       // Alt Coins (NEW)
//       else if (lower.includes("shiba") || lower.includes("shib")) asset = "Shiba Inu";
//       else if (lower.includes("xrp") || lower.includes("ripple")) asset = "XRP";
//       else if (lower.includes("xlm") || lower.includes("stellar")) asset = "Stellar";
//       else if (lower.includes("litecoin") || lower.includes("ltc")) asset = "Litecoin";
//       else if (lower.includes("chainlink") || lower.includes("link")) asset = "Chainlink";
//       else if (lower.includes("polkadot") || lower.includes("dot")) asset = "Polkadot";
//       else if (lower.includes("bitcoin cash") || lower.includes("bch")) asset = "Bitcoin Cash";
//       else if (lower.includes("avalanche") || lower.includes("avax")) asset = "Avalanche";
//       else if (lower.includes("cardano") || lower.includes("ada")) asset = "Cardano";
//       else if (lower.includes("dogecoin") || lower.includes("doge")) asset = "Dogecoin";
//       // Stablecoins
//       else if (lower.includes("tether") || lower.includes("usdt")) asset = "Tether";
//       // Stocks
//       else if (lower.includes("s&p") || lower.includes("s and p") || lower.includes("spx")) asset = "S&P 500";
//       else if (lower.includes("nasdaq") || lower.includes("ndx")) asset = "Nasdaq";
//       else if (lower.includes("dow") || lower.includes("djia")) asset = "Dow Jones";
//       else if (lower.includes("tesla") || lower.includes("tsla")) asset = "Tesla";
//       else if (lower.includes("apple") || lower.includes("aapl")) asset = "Apple";
//       else if (lower.includes("nvidia") || lower.includes("nvda")) asset = "Nvidia";
//       // Commodities
//       else if (lower.includes("gold")) asset = "Gold";
//       else if (lower.includes("oil") || lower.includes("crude")) asset = "Oil";
      
//       if (!asset) return null;
      
//       // Extract threshold
//       const thresholdStr = priceMatch[0].replace(/[$,k]/gi, "");
//       let threshold = parseFloat(thresholdStr);
//       if (priceMatch[0].toLowerCase().includes("k")) threshold *= 1000;
      
//       // Extract direction
//       let direction: "above" | "below" | undefined;
//       if (lower.includes("reach") || lower.includes("get to") || 
//           lower.includes("or above") || lower.includes("how high") ||
//           lower.includes("above") || lower.includes("exceed")) {
//         direction = "above";
//       } else if (lower.includes("dip") || lower.includes("fall") || 
//                  lower.includes("or below") || lower.includes("how low") ||
//                  lower.includes("below") || lower.includes("drop")) {
//         direction = "below";
//       }
      
//       // Extract year
//       const yearMatch = title.match(/\b(202[4-9])\b/);
//       const year = yearMatch ? yearMatch[1] : undefined;
      
//       return {
//         asset,
//         threshold,
//         direction,
//         year,
//         type: "price_threshold"
//       };
//     }
    
//     // ==== BINARY EVENT PATTERNS ====
    
//     // FED / INTEREST RATES
//     if ((lower.includes("fed") || lower.includes("federal reserve") || lower.includes("powell")) && 
//         (lower.includes("rate") || lower.includes("cut") || lower.includes("hike") || 
//          lower.includes("chair") || lower.includes("nomination") || lower.includes("confirmation"))) {
//       let asset = "Federal Reserve";
//       if (lower.includes("cut")) asset = "Fed Rate Cut";
//       else if (lower.includes("hike") || lower.includes("raise")) asset = "Fed Rate Hike";
//       else if (lower.includes("chair") || lower.includes("powell")) asset = "Fed Chair";
      
//       return {
//         asset,
//         type: "binary",
//         year: title.match(/\b(202[4-9])\b/)?.[1]
//       };
//     }
    
//     // RECESSION / ECONOMY
//     if (lower.includes("recession")) {
//       return {
//         asset: "US Recession",
//         type: "binary",
//         year: title.match(/\b(202[4-9])\b/)?.[1]
//       };
//     }
    
//     if (lower.includes("gdp") && (lower.includes("growth") || lower.includes("contract"))) {
//       return {
//         asset: "GDP Growth",
//         type: "binary",
//         year: title.match(/\b(202[4-9])\b/)?.[1]
//       };
//     }
    
//     // INFLATION / CPI
//     if (lower.includes("cpi") || (lower.includes("inflation") && !lower.includes("china"))) {
//       return {
//         asset: "US Inflation",
//         type: "binary",
//         year: title.match(/\b(202[4-9])\b/)?.[1]
//       };
//     }
    
//     // UNEMPLOYMENT
//     if (lower.includes("unemployment") || lower.includes("jobless")) {
//       return {
//         asset: "Unemployment",
//         type: "binary",
//         year: title.match(/\b(202[4-9])\b/)?.[1]
//       };
//     }
    
//     // TRUMP
//     if (lower.includes("trump") && 
//         (lower.includes("president") || lower.includes("office") || 
//          lower.includes("resign") || lower.includes("impeach"))) {
//       return {
//         asset: "Trump Presidency",
//         type: "binary",
//         year: title.match(/\b(202[4-9])\b/)?.[1]
//       };
//     }
    
//     // NATO / UKRAINE
//     if ((lower.includes("ukraine") || lower.includes("russia")) && 
//         (lower.includes("nato") || lower.includes("ceasefire") || lower.includes("peace"))) {
//       return {
//         asset: "Ukraine NATO",
//         type: "binary",
//         year: title.match(/\b(202[4-9])\b/)?.[1]
//       };
//     }
    
//     // CRYPTO REGULATIONS / RESERVE
//     if ((lower.includes("bitcoin") || lower.includes("crypto")) && 
//         (lower.includes("reserve") || lower.includes("strategic"))) {
//       return {
//         asset: "Bitcoin Reserve",
//         type: "binary",
//         year: title.match(/\b(202[4-9])\b/)?.[1]
//       };
//     }
    
//     // STABLECOINS
//     if ((lower.includes("tether") || lower.includes("usdt")) && 
//         (lower.includes("depeg") || lower.includes("insolvent") || lower.includes("de-peg"))) {
//       return {
//         asset: "Tether",
//         type: "binary",
//         year: title.match(/\b(202[4-9])\b/)?.[1]
//       };
//     }
    
//     // CRYPTO FLIPS / MARKET CAP
//     if ((lower.includes("solana") || lower.includes("sol")) && 
//         (lower.includes("flip") || lower.includes("overtake")) && 
//         lower.includes("ethereum")) {
//       return {
//         asset: "Solana",
//         type: "binary",
//         year: title.match(/\b(202[4-9])\b/)?.[1]
//       };
//     }
    
//     if (lower.includes("ethereum") && 
//         (lower.includes("flipped") || lower.includes("overtaken"))) {
//       return {
//         asset: "Ethereum",
//         type: "binary",
//         year: title.match(/\b(202[4-9])\b/)?.[1]
//       };
//     }
    
//     // CHINA CRYPTO BAN/UNBAN
//     if ((lower.includes("china") || lower.includes("chinese")) && 
//         (lower.includes("bitcoin") || lower.includes("crypto")) && 
//         (lower.includes("legalize") || lower.includes("unban") || lower.includes("legal"))) {
//       return {
//         asset: "Bitcoin",
//         type: "binary",
//         year: title.match(/\b(202[4-9])\b/)?.[1]
//       };
//     }
    
//     // SPORTS (basic patterns)
//     if (lower.includes("premier league") || lower.includes("epl")) {
//       return {
//         asset: "Premier League",
//         type: "binary",
//         year: title.match(/\b(202[4-9])\b/)?.[1]
//       };
//     }
    
//     if (lower.includes("formula 1") || lower.includes("f1")) {
//       return {
//         asset: "Formula 1",
//         type: "binary",
//         year: title.match(/\b(202[4-9])\b/)?.[1]
//       };
//     }
    
//     return null; // Fall back to AI for complex cases
//   }
  
//   // Check if two parsed markets match
//   areEquivalent(m1: ParsedMarket, m2: ParsedMarket): boolean {
//     // Must be same type
//     if (m1.type !== m2.type) return false;
    
//     // Same asset (normalized)
//     if (m1.asset !== m2.asset) return false;
    
//     // For price thresholds, must match threshold and direction
//     if (m1.type === "price_threshold") {
//       if (m1.threshold !== m2.threshold) return false;
//       if (m1.direction !== m2.direction) return false;
//     }
    
//     // Same year (if both have it)
//     if (m1.year && m2.year && m1.year !== m2.year) return false;
    
//     return true;
//   }
  
//   // Create grouping key
//   getGroupKey(parsed: ParsedMarket): string {
//     const parts = [parsed.asset, parsed.type];
//     if (parsed.threshold) parts.push(`${parsed.direction}_${parsed.threshold}`);
//     if (parsed.year) parts.push(parsed.year);
//     return parts.join("__");
//   }
// }

// // USAGE EXAMPLE:
// // const matcher = new FastMatcher();
// // 
// // const poly = matcher.parseMarket("Will Bitcoin reach $150,000 by December 31, 2025?", "Polymarket");
// // const kalshi = matcher.parseMarket("How high will Bitcoin get this year? - $150,000 or above", "Kalshi");
// //
// // if (poly && kalshi && matcher.areEquivalent(poly, kalshi)) {
// //   console.log("MATCH FOUND!");
// // }