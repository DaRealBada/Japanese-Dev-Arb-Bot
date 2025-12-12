import WebSocket from "ws";
import { PriceUpdate } from "../types/sports";
import * as crypto from "crypto";
import * as fs from "fs";

export class KalshiWebSocket {
  private ws: WebSocket | null = null;
  private readonly WS_URL = "wss://api.elections.kalshi.com/trade-api/ws/v2";
  private apiKey: string;
  private privateKeyPath: string;
  private priceUpdateCallbacks: Array<(update: PriceUpdate) => void> = [];
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private subscribedMarkets = new Set<string>();

  constructor(apiKey?: string, privateKeyPath?: string) {
    this.apiKey = apiKey || process.env.KALSHI_API_KEY || "";
    this.privateKeyPath = privateKeyPath || process.env.KALSHI_PRIVATE_KEY_PATH || "";
  }

  async connect(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("🔌 Connecting to Kalshi WebSocket...");

    // Generate auth headers (same as REST API)
    const timestamp = Date.now().toString();
    const method = "GET";
    const path = "/trade-api/ws/v2";
    const message = timestamp + method + path;

    try {
      const privateKeyPem = fs.readFileSync(this.privateKeyPath, 'utf8');
      const privateKey = crypto.createPrivateKey(privateKeyPem);

      const signature = crypto.sign('sha256', Buffer.from(message), {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
      });

      // Use HEADERS, not Bearer token
      this.ws = new WebSocket(this.WS_URL, {
        headers: {
          "KALSHI-ACCESS-KEY": this.apiKey,
          "KALSHI-ACCESS-SIGNATURE": signature.toString('base64'),
          "KALSHI-ACCESS-TIMESTAMP": timestamp
        }
      });

      this.ws.on("open", () => {
        console.log("   ✅ Kalshi WebSocket connected\n");
        this.reconnectAttempts = 0;
        resolve();
      });

      this.ws.on("message", (data: WebSocket.Data) => {
        this.handleMessage(data);
      });

      this.ws.on("error", (error) => {
        console.error("Kalshi WebSocket error:", error.message);
        reject(error);
      });

      this.ws.on("close", () => {
        console.log("Kalshi WebSocket closed");
        this.attemptReconnect();
      });

    } catch (error) {
      console.error("Error setting up WebSocket:", error);
      reject(error);
    }
  });
}
  


  /**
   * Subscribe to price updates for specific markets
   */

  subscribeToMarkets(marketIds: string[]): void {
  if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
    console.error("WebSocket not connected");
    return;
  }

  // Correct subscription format from docs
  const subscribeMessage = {
    id: Date.now(), // Unique message ID
    cmd: "subscribe",
    params: {
      channels: ["orderbook_delta"], // or ["ticker"]
      market_tickers: marketIds // Note: plural "market_tickers"
    }
  };

  this.ws.send(JSON.stringify(subscribeMessage));
  
  marketIds.forEach(id => this.subscribedMarkets.add(id));

  console.log(`📡 Subscribed to ${marketIds.length} Kalshi markets`);
}

  /**
   * Register callback for price updates
   */
  onPriceUpdate(callback: (update: PriceUpdate) => void): void {
    this.priceUpdateCallbacks.push(callback);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: WebSocket.Data): void {
  try {
    const message = JSON.parse(data.toString());
    
    // Log all messages for debugging
    console.log("📩 WebSocket message:", message.type);

    // Handle different message types from Kalshi docs
    if (message.type === "orderbook_delta" || message.type === "orderbook_snapshot") {
      const marketData = message.data || message;
      
      const update: PriceUpdate = {
        marketId: marketData.market_ticker,
        platform: "Kalshi",
        yesPrice: marketData.yes_ask ? marketData.yes_ask / 100 : 0,
        noPrice: marketData.no_ask ? marketData.no_ask / 100 : 0,
        timestamp: new Date()
      };

      this.priceUpdateCallbacks.forEach(callback => callback(update));
    } 
    else if (message.type === "ticker") {
      // Handle ticker updates
      const update: PriceUpdate = {
        marketId: message.data.market_ticker,
        platform: "Kalshi",
        yesPrice: message.data.ask / 100,
        noPrice: (100 - message.data.bid) / 100,
        timestamp: new Date()
      };
      
      this.priceUpdateCallbacks.forEach(callback => callback(update));
    }
    else if (message.type === "subscribed") {
      console.log("✅ Subscription confirmed:", message);
    }
    else if (message.type === "error") {
      console.error("❌ WebSocket error:", message);
    }
  } catch (error) {
    console.error("Error parsing WebSocket message:", error);
  }
}

  /**
   * Attempt to reconnect if connection drops
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.subscribedMarkets.clear();
    }
  }
}