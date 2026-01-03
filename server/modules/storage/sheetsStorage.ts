import { google } from "googleapis";
import { ArbitrageOpportunity, MatchedSportsPair } from "../types/sports";
import fs from "fs";

export class SheetsStorage {
  private sheets: any;
  private spreadsheetId: string;
  private readonly OPPORTUNITIES_SHEET = "Arbitrage Opportunities";
  private readonly MATCHES_SHEET = "Matched Markets";

  constructor(credentialsPath: string, spreadsheetId: string) {
    this.spreadsheetId = spreadsheetId;

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });

    this.sheets = google.sheets({ version: "v4", auth });
  }

  async initialize(): Promise<void> {
    console.log("📊 Initializing Google Sheets...");

    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      // Initialize Opportunities sheet
      await this.initializeOpportunitiesSheet(response.data.sheets);
      
      // Initialize Matches sheet
      await this.initializeMatchesSheet(response.data.sheets);

      console.log("   ✅ Google Sheets initialized\n");

    } catch (error) {
      console.error("Error initializing Google Sheets:", error);
      throw error;
    }
  }

  private async initializeOpportunitiesSheet(existingSheets: any[]): Promise<void> {
    const sheetExists = existingSheets.some(
      (s: any) => s.properties.title === this.OPPORTUNITIES_SHEET
    );

    if (!sheetExists) {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: { title: this.OPPORTUNITIES_SHEET }
            }
          }]
        }
      });
    }

    const headers = [
      "Timestamp", "Sport", "Event", "Event Date", "Days Until",
      "Poly YES", "Poly NO", "Kalshi YES", "Kalshi NO",
      "Strategy", "Cost $", "Profit %", "Profit %/Day", "Profit $",
      "Confidence", "Poly ID", "Kalshi ID"
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${this.OPPORTUNITIES_SHEET}!A1:Q1`,
      valueInputOption: "RAW",
      resource: { values: [headers] }
    });

    await this.formatHeaderRow(this.OPPORTUNITIES_SHEET);
  }

  private async initializeMatchesSheet(existingSheets: any[]): Promise<void> {
    const sheetExists = existingSheets.some(
      (s: any) => s.properties.title === this.MATCHES_SHEET
    );

    if (!sheetExists) {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: { title: this.MATCHES_SHEET }
            }
          }]
        }
      });
    }


    const headers = [
      "Timestamp", "Sport", "Event Date",
      "Poly Title", "Poly ID", "Poly YES", "Poly NO", "Poly Volume",
      "Kalshi Title", "Kalshi Ticker", "Kalshi YES", "Kalshi NO", "Kalshi Volume",
      "Confidence", "Reasoning"
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${this.MATCHES_SHEET}!A1:O1`,
      valueInputOption: "RAW",
      resource: { values: [headers] }
    });

    await this.formatHeaderRow(this.MATCHES_SHEET);
  }

  private async formatHeaderRow(sheetName: string): Promise<void> {
    const sheetId = await this.getSheetId(sheetName);

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      resource: {
        requests: [{
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 0,
              endRowIndex: 1
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
                textFormat: {
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  bold: true
                }
              }
            },
            fields: "userEnteredFormat(backgroundColor,textFormat)"
          }
        }]
      }
    });
  }

  async saveMatches(matches: MatchedSportsPair[]): Promise<void> {
    if (matches.length === 0) return;

    try {
      const rows = matches.map(match => [
        new Date().toISOString(),
        match.polyMarket.sport,
        match.polyMarket.eventDate.toISOString().split('T')[0],
        match.polyMarket.title,
        match.polyMarket.id,
        match.polyMarket.yesPrice.toFixed(4),
        match.polyMarket.noPrice.toFixed(4),
        (match.polyMarket.volume || 0).toFixed(2),
        match.kalshiMarket.title,
        match.kalshiMarket.id,
        match.kalshiMarket.yesPrice.toFixed(4),
        match.kalshiMarket.noPrice.toFixed(4),
        (match.kalshiMarket.volume || 0).toFixed(2),
        match.confidence.toFixed(2),
        match.reasoning
      ]);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.MATCHES_SHEET}!A2`,
        valueInputOption: "USER_ENTERED",
        resource: { values: rows }
      });

    } catch (error) {
      console.error("Error saving matches to Google Sheets:", error);
    }
  }

  async saveMatchImmediately(match: MatchedSportsPair): Promise<void> {
    try {
      const row = [
        new Date().toISOString(),
        match.polyMarket.sport,
        match.polyMarket.eventDate.toISOString().split('T')[0],
        match.polyMarket.title,
        match.polyMarket.id,
        match.polyMarket.yesPrice.toFixed(4),
        match.polyMarket.noPrice.toFixed(4),
        (match.polyMarket.volume || 0).toFixed(2),
        match.kalshiMarket.title,
        match.kalshiMarket.id,
        match.kalshiMarket.yesPrice.toFixed(4),
        match.kalshiMarket.noPrice.toFixed(4),
        (match.kalshiMarket.volume || 0).toFixed(2),
        match.confidence.toFixed(2),
        match.reasoning
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.MATCHES_SHEET}!A2`,
        valueInputOption: "USER_ENTERED",
        resource: { values: [row] }
      });

    } catch (error) {
      console.error("Error saving match:", error);
    }
  }

  async saveOpportunities(opportunities: ArbitrageOpportunity[]): Promise<void> {
    if (opportunities.length === 0) return;

    console.log(`\n💾 Saving ${opportunities.length} opportunities to Google Sheets...`);

    try {
      const rows = opportunities.map(opp => [
        new Date().toISOString(),
        opp.polyMarket.sport,
        opp.polyMarket.title,
        opp.polyMarket.eventDate.toISOString(),
        opp.daysUntilEvent,
        opp.polyMarket.yesPrice.toFixed(3),    // Poly YES
        opp.polyMarket.noPrice.toFixed(3),     // Poly NO
        opp.kalshiMarket.yesPrice.toFixed(3),  // Kalshi YES
        opp.kalshiMarket.noPrice.toFixed(3),   // Kalshi NO
        opp.strategy,
        `$${opp.cost.toFixed(2)}`,
        opp.profitPercent.toFixed(2),
        opp.profitPercentPerDay.toFixed(3),
        `$${opp.potentialProfit.toFixed(2)}`,
        `${(opp.confidence * 100).toFixed(0)}%`,
        opp.polyMarket.id,
        opp.kalshiMarket.id
      ]);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.OPPORTUNITIES_SHEET}!A2`,
        valueInputOption: "USER_ENTERED",
        resource: { values: rows }
      });

      await this.applyConditionalFormatting();

      console.log("   ✅ Saved to Google Sheets\n");

    } catch (error) {
      console.error("Error saving to Google Sheets:", error);
    }
  }

  private async getSheetId(sheetName: string): Promise<number> {
    const response = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId
    });

    const sheet = response.data.sheets.find(
      (s: any) => s.properties.title === sheetName
    );

    return sheet?.properties?.sheetId || 0;
  }

  private async applyConditionalFormatting(): Promise<void> {
    try {
      const sheetId = await this.getSheetId(this.OPPORTUNITIES_SHEET);

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            addConditionalFormatRule: {
              rule: {
                ranges: [{
                  sheetId,
                  startColumnIndex: 11,
                  endColumnIndex: 12
                }],
                gradientRule: {
                  minpoint: {
                    color: { red: 1, green: 0.9, blue: 0.9 },
                    type: "MIN"
                  },
                  maxpoint: {
                    color: { red: 0.7, green: 1, blue: 0.7 },
                    type: "MAX"
                  }
                }
              },
              index: 0
            }
          }]
        }
      });
    } catch (error) {
      // Ignore
    }
  }

  async getRecentOpportunities(limit: number = 50): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.OPPORTUNITIES_SHEET}!A2:Q${limit + 1}`
      });

      return response.data.values || [];
    } catch (error) {
      console.error("Error reading from Google Sheets:", error);
      return [];
    }
  }

  async clearData(): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `${this.OPPORTUNITIES_SHEET}!A2:Q`
      });

      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `${this.MATCHES_SHEET}!A2:O`
      });

      console.log("✅ Cleared sheet data");
    } catch (error) {
      console.error("Error clearing sheet:", error);
    }
  }
}