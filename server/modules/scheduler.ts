import cron from "node-cron";
import { DataFetcher } from "./dataFetcher";
import { ArbitrageDetector } from "./arbitrageDetector";
import { storage } from "../storage";

export class Scheduler {
  private dataFetcher: DataFetcher;
  private arbitrageDetector: ArbitrageDetector;
  private isRunning: boolean = false;

  constructor() {
    this.dataFetcher = new DataFetcher();
    this.arbitrageDetector = new ArbitrageDetector();
  }

  private async runDataFetchCycle(): Promise<void> {
    if (this.isRunning) {
      console.log("Skipping cycle - previous cycle still running");
      return;
    }

    this.isRunning = true;
    console.log("Starting data fetch cycle...");

    try {
      const markets = await this.dataFetcher.fetchAll();
      console.log(`Fetched ${markets.length} market snapshots`);

      await storage.saveMarketSnapshots(markets);

      const opportunities = await this.arbitrageDetector.detectOpportunities(markets);
      console.log(`Detected ${opportunities.length} potential opportunities`);

      await storage.saveOpportunities(opportunities);

      await storage.trackOpportunities(markets);

    } catch (error) {
      console.error("Error in data fetch cycle:", error);
    } finally {
      this.isRunning = false;
    }
  }

  start(): void {
    console.log("Starting scheduler...");

    this.runDataFetchCycle();

    cron.schedule("*/10 * * * * *", () => {
      this.runDataFetchCycle();
    });

    console.log("Scheduler started - running every 10 seconds");
  }

  async stop(): Promise<void> {
    console.log("Stopping scheduler...");
  }
}
