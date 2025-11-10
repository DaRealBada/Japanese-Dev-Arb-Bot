import axios, { AxiosError } from "axios";
import { log } from "console";
import "dotenv/config";
import "dotenv/config";

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

function normalizeGeneric(list: AnyRecord[], source: string): NormalizedMarketData[] {
  const results: NormalizedMarketData[] = [];
  for (const item of list) {
    // Try a variety of common field names across PM APIs
    const event = pickFirst<string>(item, ["event", "question", "title", "name", "label"]) || "Unknown Event";
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

function cryptoRandomId(): string {
  // lightweight unique ID without extra deps
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
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
      // Only accept 2xx
      if (res.status >= 200 && res.status < 300) {
        return res.data;
      }
      // Non-2xx
      lastError = new Error(`HTTP ${res.status} for ${url}`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < retries) {
      await sleep(retryDelay * (attempt + 1));
    }
  }
  const { status, url: eurl, message } = summarizeAxiosError(lastError);
  console.warn(`Fetch failed${status ? ` (${status})` : ""}: ${eurl ?? url} :: ${message}`);
  return undefined;
}

async function getFirstWorkingJson(
  urls: (string | undefined)[],
  headers?: Record<string, string>,
  opts?: { timeoutMs?: number; retries?: number; retryDelayMs?: number }
): Promise<any> {
  for (const candidate of urls) {
    if (!candidate) continue;
    const data = await getJson(candidate, headers, opts);
    if (data !== undefined) return data;
  }
  return undefined;
}

export class DataFetcher {
  private async fetchPolymarket(): Promise<NormalizedMarketData[]> {
    try {
      const url = process.env.POLYMARKET_API_URL || "https://gamma-api.polymarket.com/markets?limit=1000&active=true";
      const data = await getJson(url, undefined, { timeoutMs: 15000, retries: 1 });
      const markets: AnyRecord[] = Array.isArray(data) ? data : (data?.markets ?? []);
      return normalizeGeneric(markets, "Polymarket");
    } catch (error) {
      console.error("Polymarket fetch error:", error);
      return [];
    }
  }

  private async fetchLimitless(): Promise<NormalizedMarketData[]> {
    try {
      const url = process.env.LIMITLESS_API_URL || "https://api.limitless.exchange/markets";
      const apiKey = process.env.LIMITLESS_API_KEY;
      const candidates = [
        url,
        url?.endsWith("/markets") ? `${url}/active` : undefined,
        "https://api.limitless.exchange/api/markets",
        "https://api.limitless.exchange/v1/markets",
        "https://api.limitless.exchange/markets?status=active",
      ];
      const data = await getFirstWorkingJson(
        candidates,
        apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
        { timeoutMs: 20000, retries: 2 }
      );
      const markets: AnyRecord[] = Array.isArray(data) ? data : (data?.markets ?? []);
      return normalizeGeneric(markets, "Limitless");
    } catch (error) {
      console.error("Limitless fetch error:", error);
      return [];
    }
  }

  private async fetchMyriad(): Promise<NormalizedMarketData[]> {
    try {
      const url = process.env.MYRIAD_API_URL || "https://api.myriad.market/markets";
      const apiKey = process.env.MYRIAD_API_KEY;
      const data = await getJson(url, apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined, { timeoutMs: 20000, retries: 2 });
      console.log("Myriad data:", data);
      const markets: AnyRecord[] = Array.isArray(data) ? data : (data?.markets ?? []);
      return normalizeGeneric(markets, "Myriad");
    } catch (error) {
      console.error("Myriad fetch error:", error);
      return [];
    }
  }

  private async fetchKalshi(): Promise<NormalizedMarketData[]> {
    try {
      const url = process.env.KALSHI_API_URL || "https://api.elections.kalshi.com/v2/markets";
      const apiKey = process.env.KALSHI_API_KEY;
      const apiSecret = process.env.KALSHI_API_SECRET;
      const headers: Record<string, string> | undefined = apiKey
        ? { "X-API-Key": apiKey, "X-API-Secret": apiSecret ?? "" }
        : undefined;
      const candidates = [
        url,
        "https://trading-api.kalshi.com/v2/markets",
        "https://api.elections.kalshi.com/v2/markets",
        "https://api.elections.kalshi.com/v2/markets?limit=1000",
      ];
      const data = await getFirstWorkingJson(candidates, headers, { timeoutMs: 15000, retries: 1 });
      const markets: AnyRecord[] = Array.isArray(data) ? data : (data?.markets ?? []);
      return normalizeGeneric(markets, "Kalshi");
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
