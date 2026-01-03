import cron from "node-cron";
import { DomeSportsFetcher } from "./fetchers/domeSportsFetcher";
import { ProfitCalculator } from "./matching/profitCalculator";
import { SheetsStorage } from "./storage/sheetsStorage";

export class Scheduler {
  private isRunning: boolean = false;
  private domeFetcher: DomeSportsFetcher;
  private profitCalc: ProfitCalculator;
  private sheetsStorage: SheetsStorage;

  constructor() {
    
    const domeApiKey = process.env.DOME_API_KEY || "";
    
    if (!domeApiKey) {
      throw new Error("DOME_API_KEY is required");
    }
    
    this.domeFetcher = new DomeSportsFetcher(domeApiKey);
    this.profitCalc = new ProfitCalculator();

    const credentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS || "./server/config/credentials.json";
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID || "";
    console.log(`📋 Spreadsheet ID: ${spreadsheetId}`); // ADD THIS
    this.sheetsStorage = new SheetsStorage(credentialsPath, spreadsheetId);
  }
  

  private async runDetectionCycle(): Promise<void> {
    if (this.isRunning) {
      console.log("⏭️  Skipping cycle - previous cycle still running");
      return;
    }

    this.isRunning = true;

    console.log("\n" + "=".repeat(80));
    console.log("🏈 SPORTS ARBITRAGE DETECTION (DOME API)");
    console.log("=".repeat(80));
    console.log(`Started: ${new Date().toISOString()}`);

    try {
      const matches = await this.domeFetcher.getMatchedSportsMarkets();

      if (matches.length === 0) {
        console.log("❌ No matching sports markets found");
        return;
      }

      console.log(`\n📊 Found ${matches.length} matched sports pairs`);

      // Matches are already saved individually during fetching
      console.log("   ✅ All matches saved to Google Sheets during fetch");

      const opportunities = this.profitCalc.findOpportunities(matches);

      if (opportunities.length === 0) {
        console.log("❌ No profitable arbitrage found");
        console.log("   (But matches were saved for training data)");
        return;
      }

      console.log("\n" + "=".repeat(80));
      console.log("💰 TOP ARBITRAGE OPPORTUNITIES");
      console.log("=".repeat(80));

      const topOpps = opportunities.slice(0, 10);
      
      for (let i = 0; i < topOpps.length; i++) {
        const opp = topOpps[i];
        console.log(`\n${i + 1}. ${opp.polyMarket.title.substring(0, 70)}...`);
        console.log(`   Sport: ${opp.polyMarket.sport} | Event: ${opp.polyMarket.eventDate.toLocaleDateString()}`);
        console.log(`   Profit: ${opp.profitPercent.toFixed(2)}% (${opp.profitPercentPerDay.toFixed(3)}%/day)`);
        console.log(`   Poly: ${opp.polyMarket.yesPrice.toFixed(3)} | Kalshi: ${opp.kalshiMarket.yesPrice.toFixed(3)}`);
        console.log(`   Strategy: ${opp.strategy}`);
        console.log(`   Cost: $${opp.cost.toFixed(2)} → Profit: $${opp.potentialProfit.toFixed(2)}`);
        console.log(`   Confidence: ${(opp.confidence * 100).toFixed(0)}%`);
        console.log(`   Days until event: ${opp.daysUntilEvent}`);
      }

      await this.sheetsStorage.saveOpportunities(opportunities);

      console.log("\n" + "=".repeat(80));
      console.log(`✅ CYCLE COMPLETE: Found ${opportunities.length} opportunities`);
      console.log(`   Saved opportunities to 'Arbitrage Opportunities' sheet`);
      console.log(`   Saved ${matches.length} matched pairs to 'Matched Markets' sheet`);
      console.log("=".repeat(80) + "\n");

    } catch (error) {
      console.error("\n❌ ERROR IN DETECTION CYCLE:", error);
      if (error instanceof Error) {
        console.error("Details:", error.message);
        console.error("Stack:", error.stack);
      }
    } finally {
      this.isRunning = false;
    }
  }

  async start(): Promise<void> {
    console.log("\n🚀 Starting Sports Arbitrage Bot (Dome API)...\n");

    await this.sheetsStorage.initialize();
    
    // Pass sheets storage to fetcher after initialization
    this.domeFetcher.setSheetsStorage(this.sheetsStorage);
    
    await this.runDetectionCycle();

    cron.schedule("*/10 * * * *", () => {
      this.runDetectionCycle();
    });

    console.log("⏰ Scheduler running - checking every 10 minutes\n");
  }

  async stop(): Promise<void> {
    console.log("🛑 Stopping scheduler...");
    this.isRunning = false;
  }
}