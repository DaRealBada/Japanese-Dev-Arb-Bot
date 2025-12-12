import axios from "axios";
import "dotenv/config";
import * as fs from "fs";
import * as crypto from "crypto";

// --- Simple Auth Helper (Required for Kalshi) ---
function getHeaders(path: string) {
  try {
    const key = process.env.KALSHI_API_KEY;
    const pemPath = process.env.KALSHI_PRIVATE_KEY_PATH;
    if (!key || !pemPath) throw new Error("Missing .env keys");

    const privateKey = crypto.createPrivateKey(fs.readFileSync(pemPath, 'utf8'));
    const timestamp = Date.now().toString();
    const message = timestamp + "GET" + path;

    const signature = crypto.sign('sha256', Buffer.from(message), {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    }).toString('base64');

    return {
      "Content-Type": "application/json",
      "KALSHI-ACCESS-KEY": key,
      "KALSHI-ACCESS-SIGNATURE": signature,
      "KALSHI-ACCESS-TIMESTAMP": timestamp,
    };
  } catch (e) {
    console.error("Auth Error:", e);
    return {};
  }
}

async function run() {
  const baseUrl = "https://api.elections.kalshi.com";

  console.log("\n🔎 FETCHING KALSHI SERIES (CATEGORIES)...\n");

  try {
    // 1. Get Series (Categories like 'KXBTCMAXY')
    const seriesPath = "/trade-api/v2/series";
    const seriesRes = await axios.get(baseUrl + seriesPath, { headers: getHeaders(seriesPath) });
    
    const series = seriesRes.data.series;
    console.log(`✅ Found ${series.length} Series Tickers. Here are the first 20:\n`);
    
    // Print a clean table of tickers
    series.slice(0, 20).forEach((s: any) => {
      console.log(`- ${s.ticker.padEnd(15)} | ${s.title}`);
    });
    console.log("... (and more)\n");

    // 2. Get a Real Market Example (Metadata)
    console.log("🔎 FETCHING REAL MARKET METADATA...\n");
    const marketPath = "/trade-api/v2/markets?limit=1&status=open";
    const marketRes = await axios.get(baseUrl + marketPath, { headers: getHeaders(marketPath) });
    
    const market = marketRes.data.markets[0];
    
    console.log("TYPE: ", typeof market);
    console.log(JSON.stringify(market, null, 2));

  } catch (error: any) {
    console.error("❌ API Error:", error.response?.data || error.message);
  }
}

run();