import axios, { AxiosError } from "axios";
import { log } from "console";
import "dotenv/config";
import * as fs from "fs";
import * as crypto from "crypto";

export interface NormalizedMarketData {
  source: string;
  marketId: string;
  event: string;
  side: string;
  price: number;
  timestamp: Date;
  metadata?: any;
}

type AnyRecord = Record<string, any>;

function coerceNumber(value: any): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function pickFirst<T = any>(obj: AnyRecord, keys: string[]): T | undefined {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k] as T;
  }
  return undefined;
}

function cryptoRandomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function normalizeGeneric(list: AnyRecord[], source: string): NormalizedMarketData[] {
  const results: NormalizedMarketData[] = [];
  
  for (const item of list) {
    let event = "Unknown Event";

    // === CRITICAL FIX: Combine Title + Subtitle for Kalshi ===
    // Kalshi separates the event ("Fed Rates") from the specific line ("< 4.5%")
    if (source === "Kalshi") {
      const title = item.title || item.question || "";
      const subtitle = item.yes_sub_title || item.subtitle || item.no_sub_title || "";
      
      if (title && subtitle) {
        event = `${title} - ${subtitle}`;
      } else {
        event = title || subtitle || "Unknown Kalshi Market";
      }
    } else {
      // Polymarket/Others: Keep existing logic
      event = pickFirst<string>(item, ["event", "question", "title", "name", "label"]) || "Unknown Event";
    }

    const marketId = String(
      pickFirst<any>(item, ["id", "marketId", "market_id", "slug", "ticker", "question_id"]) ?? cryptoRandomId()
    );
    const side = pickFirst<string>(item, ["side", "outcome", "contract", "position"]) || "YES";
    const priceRaw = pickFirst<any>(item, [
      "price",
      "lastPrice",
      "last_price",
      "yes_price",
      "bestBid",
      "best_bid",
      "mid",
    ]);
    const priceCandidate = coerceNumber(priceRaw);

    const price = priceCandidate !== undefined
      ? (priceCandidate > 1 ? priceCandidate / 100 : priceCandidate)
      : undefined;

    if (price === undefined) continue;

    results.push({
      source,
      marketId,
      event,
      side,
      price,
      timestamp: new Date(),
      metadata: item,
    });
  }
  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function summarizeAxiosError(err: unknown): { status?: number; url?: string; message: string } {
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError;
    const status = e.response?.status;
    const url = (e.config as any)?.url as string | undefined;
    return { status, url, message: e.message };
  }
  return { message: (err as Error)?.message || String(err) };
}

async function getJson(
  url?: string,
  headers?: Record<string, string>,
  opts?: { timeoutMs?: number; retries?: number; retryDelayMs?: number }
): Promise<any> {
  if (!url) return undefined;
  const timeout = opts?.timeoutMs ?? 20000;
  const retries = Math.max(0, opts?.retries ?? 2);
  const retryDelay = opts?.retryDelayMs ?? 750;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, { headers, timeout });
      if (res.status >= 200 && res.status < 300) {
        return res.data;
      }
      lastError = new Error(`HTTP ${res.status} for ${url}`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < retries) {
      await sleep(retryDelay * (attempt + 1));
    }
  }
  
  // Silenced error logs to keep terminal clean
  return undefined;
}

function generateKalshiAuthHeaders(path: string, method: string = "GET"): Record<string, string> | undefined {
  const apiKey = process.env.KALSHI_API_KEY;
  const privateKeyPath = process.env.KALSHI_PRIVATE_KEY_PATH;

  if (!apiKey || !privateKeyPath) return undefined;

  try {
    const privateKeyPem = fs.readFileSync(privateKeyPath, 'utf8');
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

    const b64Signature = signature.toString('base64');

    return {
      "Content-Type": "application/json",
      "KALSHI-ACCESS-KEY": apiKey,
      "KALSHI-ACCESS-SIGNATURE": b64Signature,
      "KALSHI-ACCESS-TIMESTAMP": timestampStr,
    };
  } catch (error) {
    console.error("Error generating Kalshi auth headers:", error);
    return undefined;
  }
}

export class DataFetcher {
  private async fetchPolymarket(): Promise<NormalizedMarketData[]> {
    try {
      const urls = [
        "https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=500",
        "https://gamma-api.polymarket.com/markets?active=true&limit=500",
        process.env.POLYMARKET_API_URL,
      ];
      
      let data;
      for (const url of urls) {
        if (!url) continue;
        data = await getJson(url, undefined, { timeoutMs: 15000, retries: 1 });
        if (data) break;
      }
      
      if (!data) return [];
      
      const markets: AnyRecord[] = Array.isArray(data) ? data : (data?.markets ?? []);
      
      const activeMarkets = markets.filter((m: AnyRecord) => {
        const closed = m.closed || m.status === "closed";
        const active = m.active !== false;
        return !closed && active;
      });
      
      console.log(`Polymarket: Fetched ${markets.length} markets, ${activeMarkets.length} active`);
      return normalizeGeneric(activeMarkets, "Polymarket");
    } catch (error) {
      console.error("Polymarket fetch error:", error);
      return [];
    }
  }

  private async fetchLimitless(): Promise<NormalizedMarketData[]> {
    try {
      const url = process.env.LIMITLESS_API_URL || "https://api.limitless.exchange/markets";
      const apiKey = process.env.LIMITLESS_API_KEY;
      const data = await getJson(
        url,
        apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
        { timeoutMs: 20000, retries: 2 }
      );
      const markets: AnyRecord[] = Array.isArray(data) ? data : (data?.markets ?? []);
      return normalizeGeneric(markets, "Limitless");
    } catch (error) {
      return [];
    }
  }

  private async fetchMyriad(): Promise<NormalizedMarketData[]> {
    try {
      const url = process.env.MYRIAD_API_URL || "https://api.myriad.market/markets";
      const apiKey = process.env.MYRIAD_API_KEY;
      const data = await getJson(
        url,
        apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
        { timeoutMs: 20000, retries: 2 }
      );
      const markets: AnyRecord[] = Array.isArray(data) ? data : (data?.markets ?? []);
      return normalizeGeneric(markets, "Myriad");
    } catch (error) {
      return [];
    }
  }

  // === UPDATED: Fetches ALL Kalshi markets via pagination ===
  private async fetchKalshi(): Promise<NormalizedMarketData[]> {
    try {
      const allMarkets: AnyRecord[] = [];
      let cursor: string | undefined;
      const limit = 500; // Fetch in large chunks to minimize API calls

      // Loop until no cursor is returned (end of data)
      while (true) {
        const path = "/trade-api/v2/markets";
        const headers = generateKalshiAuthHeaders(path, "GET");
        if (!headers) break;

        let url = `https://api.elections.kalshi.com${path}?limit=${limit}&status=open`;
        if (cursor) url += `&cursor=${cursor}`;

        const data = await getJson(url, headers, { timeoutMs: 15000, retries: 2 });
        
        // Safety check for response format
        const markets = Array.isArray(data) ? data : (data?.markets || []);
        if (markets.length === 0) break;
        
        allMarkets.push(...markets);
        
        // Prepare next page
        cursor = data?.cursor;
        if (!cursor) break; // Stop if no more pages
        
        // Tiny delay to be nice to their API rate limit
        await new Promise(r => setTimeout(r, 100));
      }
      
      console.log(`Kalshi: Fetched ${allMarkets.length} total active markets (Paginated)`);
      return normalizeGeneric(allMarkets, "Kalshi");

    } catch (error) {
      console.error("Kalshi fetch error:", error);
      return [];
    }
  }

  async fetchAll(): Promise<NormalizedMarketData[]> {
    const [polymarket, limitless, myriad, kalshi] = await Promise.all([
      this.fetchPolymarket(),
      this.fetchLimitless(),
      this.fetchMyriad(),
      this.fetchKalshi(),
    ]);

    return [...polymarket, ...limitless, ...myriad, ...kalshi];
  }
}