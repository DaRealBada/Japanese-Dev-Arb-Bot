// import { ArbitrageOpportunity } from "../models";
// import { createObjectCsvWriter } from "csv-writer";
// import path from "path";

// export interface LeaderboardEntry {
//   id: string;
//   rank: number;
//   event: string;
//   platformA: string;
//   platformB: string;
//   profitPercent: number;
//   profitPercentPerDay?: number;
//   daysUntilEvent?: number;
//   detectedAt: string;
//   status: string;
// }

// export class Leaderboard {
//   async getProfitPerDayLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
//     const opportunities = await ArbitrageOpportunity.find({
//       profitPercentPerDay: { $exists: true, $ne: null },
//     })
//       .sort({ profitPercentPerDay: -1 })
//       .limit(limit);

//     return opportunities.map((opp, index) => ({
//       id: opp._id.toString(),
//       rank: index + 1,
//       event: opp.event,
//       platformA: opp.platformA,
//       platformB: opp.platformB,
//       profitPercent: opp.profitPercent,
//       profitPercentPerDay: opp.profitPercentPerDay,
//       daysUntilEvent: opp.daysUntilEvent,
//       detectedAt: opp.detectedAt.toISOString(),
//       status: opp.status,
//     }));
//   }

//   async getTotalProfitLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
//     const opportunities = await ArbitrageOpportunity.find()
//       .sort({ profitPercent: -1 })
//       .limit(limit);

//     return opportunities.map((opp, index) => ({
//       id: opp._id.toString(),
//       rank: index + 1,
//       event: opp.event,
//       platformA: opp.platformA,
//       platformB: opp.platformB,
//       profitPercent: opp.profitPercent,
//       profitPercentPerDay: opp.profitPercentPerDay,
//       daysUntilEvent: opp.daysUntilEvent,
//       detectedAt: opp.detectedAt.toISOString(),
//       status: opp.status,
//     }));
//   }

//   async exportToCSV(): Promise<string> {
//     const [profitPerDay, totalProfit] = await Promise.all([
//       this.getProfitPerDayLeaderboard(100),
//       this.getTotalProfitLeaderboard(100),
//     ]);

//     const csvPath = path.join(process.cwd(), "leaderboard-export.csv");

//     const csvWriter = createObjectCsvWriter({
//       path: csvPath,
//       header: [
//         { id: "leaderboard", title: "Leaderboard" },
//         { id: "rank", title: "Rank" },
//         { id: "event", title: "Event" },
//         { id: "platformA", title: "Platform A" },
//         { id: "platformB", title: "Platform B" },
//         { id: "profitPercent", title: "Profit %" },
//         { id: "profitPercentPerDay", title: "Profit %/Day" },
//         { id: "daysUntilEvent", title: "Days Until Event" },
//         { id: "detectedAt", title: "Detected At" },
//         { id: "status", title: "Status" },
//       ],
//     });

//     const records = [
//       ...profitPerDay.map(entry => ({ leaderboard: "Profit Per Day", ...entry })),
//       ...totalProfit.map(entry => ({ leaderboard: "Total Profit", ...entry })),
//     ];

//     await csvWriter.writeRecords(records);
//     console.log(`CSV exported to ${csvPath}`);
    
//     return csvPath;
//   }
// }
