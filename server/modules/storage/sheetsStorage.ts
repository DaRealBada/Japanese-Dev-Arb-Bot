import { google } from "googleapis";
import { ArbitrageOpportunity } from "../types/sports";
import fs from "fs";

export class SheetsStorage {
  private sheets: any;
  private spreadsheetId: string;
  private readonly SHEET_NAME = "Arbitrage Opportunities";

  constructor(credentialsPath: string, spreadsheetId: string) {
    this.spreadsheetId = spreadsheetId;

    // Load service account credentials
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });

    this.sheets = google.sheets({ version: "v4", auth });
  }

  /**
   * Initialize the spreadsheet with headers
   */
  async initialize(): Promise<void> {
    console.log("📊 Initializing Google Sheets...");

    try {
      // Check if sheet exists
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const sheetExists = response.data.sheets.some(
        (s: any) => s.properties.title === this.SHEET_NAME
      );

      if (!sheetExists) {
        // Create new sheet
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [{
              addSheet: {
                properties: {
                  title: this.SHEET_NAME
                }
              }
            }]
          }
        });
      }

      // Write headers
      const headers = [
        "Timestamp",
        "Sport",
        "Event",
        "Event Date",
        "Days Until",
        "Poly Price",
        "Kalshi Price",
        "Profit %",
        "Profit %/Day",
        "Strategy",
        "Cost",
        "Profit $",
        "Confidence",
        "Poly Market ID",
        "Kalshi Market ID"
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.SHEET_NAME}!A1:O1`,
        valueInputOption: "RAW",
        resource: {
          values: [headers]
        }
      });

      // Format header row
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            repeatCell: {
              range: {
                sheetId: await this.getSheetId(),
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

      console.log("   ✅ Google Sheets initialized\n");

    } catch (error) {
      console.error("Error initializing Google Sheets:", error);
      throw error;
    }
  }

  /**
   * Save arbitrage opportunities to sheet
   */
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
        opp.polyMarket.yesPrice.toFixed(3),
        opp.kalshiMarket.yesPrice.toFixed(3),
        opp.profitPercent.toFixed(2),
        opp.profitPercentPerDay.toFixed(3),
        opp.strategy,
        `$${opp.cost.toFixed(2)}`,
        `$${opp.potentialProfit.toFixed(2)}`,
        `${(opp.confidence * 100).toFixed(0)}%`,
        opp.polyMarket.id,
        opp.kalshiMarket.id
      ]);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.SHEET_NAME}!A2`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: rows
        }
      });

      // Apply conditional formatting to profit columns
      await this.applyConditionalFormatting();

      console.log("   ✅ Saved to Google Sheets\n");

    } catch (error) {
      console.error("Error saving to Google Sheets:", error);
    }
  }

  /**
   * Get sheet ID by name
   */
  private async getSheetId(): Promise<number> {
    const response = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId
    });

    const sheet = response.data.sheets.find(
      (s: any) => s.properties.title === this.SHEET_NAME
    );

    return sheet?.properties?.sheetId || 0;
  }

  /**
   * Apply color formatting to profit columns
   */
  private async applyConditionalFormatting(): Promise<void> {
    try {
      const sheetId = await this.getSheetId();

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            {
              addConditionalFormatRule: {
                rule: {
                  ranges: [{
                    sheetId,
                    startColumnIndex: 7, // Profit % column
                    endColumnIndex: 8
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
            }
          ]
        }
      });
    } catch (error) {
      // Ignore errors - formatting is not critical
    }
  }

  /**
   * Get recent opportunities from sheet
   */
  async getRecentOpportunities(limit: number = 50): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.SHEET_NAME}!A2:O${limit + 1}`
      });

      return response.data.values || [];
    } catch (error) {
      console.error("Error reading from Google Sheets:", error);
      return [];
    }
  }

  /**
   * Clear all data (keep headers)
   */
  async clearData(): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `${this.SHEET_NAME}!A2:O`
      });

      console.log("✅ Cleared sheet data");
    } catch (error) {
      console.error("Error clearing sheet:", error);
    }
  }
}