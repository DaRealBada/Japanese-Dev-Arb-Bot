import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/platforms/status", async (req, res) => {
    try {
      const statuses = await storage.getPlatformStatus();
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching platform status:", error);
      res.status(500).json({ error: "Failed to fetch platform status" });
    }
  });

  app.get("/api/opportunities", async (req, res) => {
    try {
      const opportunities = await storage.getOpportunities();
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      res.status(500).json({ error: "Failed to fetch opportunities" });
    }
  });

  app.get("/api/opportunities/recent", async (req, res) => {
    try {
      const opportunities = await storage.getRecentOpportunities();
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching recent opportunities:", error);
      res.status(500).json({ error: "Failed to fetch recent opportunities" });
    }
  });

  app.get("/api/leaderboard/profit-per-day", async (req, res) => {
    try {
      const entries = await storage.getProfitPerDayLeaderboard(20);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching profit per day leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  app.get("/api/leaderboard/total-profit", async (req, res) => {
    try {
      const entries = await storage.getTotalProfitLeaderboard(20);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching total profit leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  app.get("/api/reaction-times/stats", async (req, res) => {
    try {
      const stats = await storage.getReactionTimeStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching reaction time stats:", error);
      res.status(500).json({ error: "Failed to fetch reaction time stats" });
    }
  });

  app.get("/api/reaction-times/closed", async (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit || "25"), 10) || 25, 200);
      const items = await storage.getClosedOpportunities(limit);
      res.json(items);
    } catch (error) {
      console.error("Error fetching closed opportunities:", error);
      res.status(500).json({ error: "Failed to fetch closed opportunities" });
    }
  });

  app.post("/api/export/csv", async (req, res) => {
    try {
      const filePath = await storage.exportToCSV();
      res.json({ 
        success: true,
        message: "Leaderboard data exported successfully",
        filePath 
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
