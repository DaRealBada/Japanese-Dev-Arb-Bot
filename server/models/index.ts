import mongoose from "mongoose";

const marketSnapshotSchema = new mongoose.Schema({
  source: { type: String, required: true },
  marketId: { type: String, required: true },
  event: { type: String, required: true },
  side: { type: String, required: true },
  price: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed },
});

const arbitrageOpportunitySchema = new mongoose.Schema({
  platformA: { type: String, required: true },
  platformB: { type: String, required: true },
  marketIdA: { type: String, required: true },
  marketIdB: { type: String, required: true },
  event: { type: String, required: true },
  priceA: { type: Number, required: true },
  priceB: { type: Number, required: true },
  profitPercent: { type: Number, required: true },
  profitPercentPerDay: { type: Number },
  daysUntilEvent: { type: Number },
  status: { type: String, default: "active" },
  detectedAt: { type: Date, default: Date.now },
  closedAt: { type: Date },
  reactionTimeSeconds: { type: Number },
});

const reactionTrackingSchema = new mongoose.Schema({
  opportunityId: { type: String, required: true },
  checkTimestamp: { type: Date, default: Date.now },
  platformA: { type: String, required: true },
  platformB: { type: String, required: true },
  priceA: { type: Number, required: true },
  priceB: { type: Number, required: true },
  priceGap: { type: Number, required: true },
  stillActive: { type: String, default: "true" },
});

marketSnapshotSchema.index({ source: 1, marketId: 1, timestamp: -1 });
arbitrageOpportunitySchema.index({ status: 1, detectedAt: -1 });
arbitrageOpportunitySchema.index({ profitPercent: -1 });
arbitrageOpportunitySchema.index({ profitPercentPerDay: -1 });
reactionTrackingSchema.index({ opportunityId: 1, checkTimestamp: -1 });

export const MarketSnapshot = mongoose.model("MarketSnapshot", marketSnapshotSchema);
export const ArbitrageOpportunity = mongoose.model("ArbitrageOpportunity", arbitrageOpportunitySchema);
export const ReactionTracking = mongoose.model("ReactionTracking", reactionTrackingSchema);
