import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Platform enum for type safety
export const PLATFORMS = ["Polymarket", "Limitless", "Myriad", "Kalshi"] as const;
export type Platform = typeof PLATFORMS[number];

// Market Snapshots - stores raw market data from each platform
export const marketSnapshots = pgTable("market_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(),
  marketId: text("market_id").notNull(),
  event: text("event").notNull(),
  side: text("side").notNull(), 
  price: decimal("price", { precision: 10, scale: 6 }).notNull(), 
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: jsonb("metadata"),
});

// Arbitrage Opportunities - detected price mismatches
export const arbitrageOpportunities = pgTable("arbitrage_opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformA: text("platform_a").notNull(),
  platformB: text("platform_b").notNull(),
  marketIdA: text("market_id_a").notNull(),
  marketIdB: text("market_id_b").notNull(),
  event: text("event").notNull(),
  priceA: decimal("price_a", { precision: 10, scale: 6 }).notNull(),
  priceB: decimal("price_b", { precision: 10, scale: 6 }).notNull(),
  profitPercent: decimal("profit_percent", { precision: 10, scale: 4 }).notNull(), // Total profit %
  profitPercentPerDay: decimal("profit_percent_per_day", { precision: 10, scale: 4 }), // Profit % normalized by days until event
  daysUntilEvent: integer("days_until_event"), // Days remaining until event resolves
  status: text("status").notNull().default("active"), // active, closing, closed
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
  reactionTimeSeconds: integer("reaction_time_seconds"), // Time until price gap closed
});

// Reaction Tracking - monitors how long arbitrage opportunities persist
export const reactionTracking = pgTable("reaction_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  opportunityId: varchar("opportunity_id").notNull().references(() => arbitrageOpportunities.id),
  checkTimestamp: timestamp("check_timestamp").notNull().defaultNow(),
  platformA: text("platform_a").notNull(),
  platformB: text("platform_b").notNull(),
  priceA: decimal("price_a", { precision: 10, scale: 6 }).notNull(),
  priceB: decimal("price_b", { precision: 10, scale: 6 }).notNull(),
  priceGap: decimal("price_gap", { precision: 10, scale: 6 }).notNull(), // Absolute difference
  stillActive: text("still_active").notNull().default("true"), // "true" or "false"
});

// Zod schemas for validation
export const insertMarketSnapshotSchema = createInsertSchema(marketSnapshots).omit({
  id: true,
  timestamp: true,
});

export const insertArbitrageOpportunitySchema = createInsertSchema(arbitrageOpportunities).omit({
  id: true,
  detectedAt: true,
  closedAt: true,
});

export const insertReactionTrackingSchema = createInsertSchema(reactionTracking).omit({
  id: true,
  checkTimestamp: true,
});

// TypeScript types
export type InsertMarketSnapshot = z.infer<typeof insertMarketSnapshotSchema>;
export type MarketSnapshot = typeof marketSnapshots.$inferSelect;

export type InsertArbitrageOpportunity = z.infer<typeof insertArbitrageOpportunitySchema>;
export type ArbitrageOpportunity = typeof arbitrageOpportunities.$inferSelect;

export type InsertReactionTracking = z.infer<typeof insertReactionTrackingSchema>;
export type ReactionTracking = typeof reactionTracking.$inferSelect;

// Frontend types for API responses
export interface DashboardStats {
  totalOpportunities: number;
  activeOpportunities: number;
  avgReactionTime: number; // in seconds
  marketsMonitored: number;
  totalProfitPercent: number;
}

export interface PlatformStatus {
  platform: Platform;
  marketsMonitored: number;
  lastFetch: string;
  isHealthy: boolean;
  activeOpportunities: number;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  event: string;
  platformA: Platform;
  platformB: Platform;
  profitPercent: number;
  profitPercentPerDay?: number;
  daysUntilEvent?: number;
  detectedAt: string;
  status: string;
}

export interface OpportunityDetail extends ArbitrageOpportunity {
  priceHistory?: Array<{
    timestamp: string;
    priceA: number;
    priceB: number;
    gap: number;
  }>;
}
