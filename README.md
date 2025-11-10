# Real-Time Arbitrage Analytics System

A comprehensive real-time monitoring and analytics platform for detecting arbitrage opportunities across prediction markets (Polymarket, Limitless, Myriad, and Kalshi).

## Features

- **Real-Time Data Fetching**: Monitors 4 prediction market platforms every 5-10 seconds
- **Arbitrage Detection**: Automatically identifies price mismatches across equivalent markets
- **Reaction Time Tracking**: Measures how long arbitrage opportunities persist before price convergence
- **Dual Leaderboards**:
  - Leaderboard 1: Ranked by Profit % Per Day
  - Leaderboard 2: Ranked by Total Profit %
- **Beautiful Dashboard**: Professional, data-dense UI with real-time updates
- **MongoDB Persistence**: All market snapshots and arbitrage opportunities stored for historical analysis
- **CSV Export**: Export leaderboard data for external analysis
- **Dark Mode**: Full dark mode support with theme toggle

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS + shadcn/ui components
- TanStack Query for data fetching
- Recharts for data visualization
- Wouter for routing

### Backend
- Node.js + Express with TypeScript
- MongoDB with Mongoose
- Node-cron for scheduled tasks
- Axios for API requests
- Modular architecture (dataFetcher, arbitrageDetector, reactionTracker, leaderboard)

## Prerequisites

- Node.js 20+ 
- MongoDB (local or Atlas)
- API keys for prediction market platforms (optional for testing)

## Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/arbitrage-analytics

# Data source URLs and API keys
# Polymarket works out-of-the-box via public endpoint if not set
POLYMARKET_API_URL=https://gamma-api.polymarket.com/markets?limit=1000&active=true

# Set these to enable real data for other platforms
LIMITLESS_API_URL=https://api.limitless.exchange/markets
LIMITLESS_API_KEY=your_key_here

MYRIAD_API_URL=https://api.myriad.market/markets
MYRIAD_API_KEY=your_key_here

# Kalshi typically requires auth; provide your credentials or proxy URL
KALSHI_API_URL=https://trading-api.kalshi.com/v2/markets
KALSHI_API_KEY=your_key_here
KALSHI_API_SECRET=your_secret_here

# Session Secret (already configured)
SESSION_SECRET=your_session_secret
```

## Installation

```bash
# Install dependencies
npm install

# Start MongoDB (if using local instance)
# mongod --dbpath /path/to/data/directory

# Start the application
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (Dashboard, Opportunities, etc.)
│   │   └── lib/           # Utilities and query client
├── server/                # Backend Express application
│   ├── modules/           # Core business logic modules
│   │   ├── dataFetcher.ts        # API connections to prediction markets
│   │   ├── arbitrageDetector.ts  # Price mismatch detection
│   │   ├── reactionTracker.ts    # Monitors opportunity lifecycle
│   │   └── leaderboard.ts        # Leaderboard generation
│   ├── models/            # Mongoose schemas
│   ├── routes.ts          # API endpoints
│   └── storage.ts         # Data access layer
├── shared/                # Shared TypeScript types and schemas
│   └── schema.ts          # Data models and types
└── README.md
```

## Module Descriptions

### 1. dataFetcher.ts
Connects to APIs for Polymarket, Limitless, Myriad, and Kalshi. Normalizes data into a unified format:
```typescript
{ source, marketId, event, side, price, timestamp }
```

### 2. arbitrageDetector.ts
Compares equivalent markets across platforms, detects price mismatches, and calculates:
- Total profit percentage
- Profit percentage per day (normalized by event maturity)

### 3. reactionTracker.ts
- Logs start time when arbitrage is detected
- Continuously monitors until price gap closes
- Records `time_to_close_gap` (competitor reaction time)

### 4. leaderboard.ts
Generates two leaderboards:
- **Leaderboard 1**: Ranked by profit % per day
- **Leaderboard 2**: Ranked by total profit %

Exports data to CSV and displays in dashboard.

### 5. index.ts
Entry point that orchestrates the periodic fetch-detect-track loop with error handling and graceful shutdown.

## API Endpoints

- `GET /api/stats` - Dashboard statistics
- `GET /api/platforms/status` - Platform health and status
- `GET /api/opportunities` - All arbitrage opportunities
- `GET /api/opportunities/recent` - Recent opportunities
- `GET /api/leaderboard/profit-per-day` - Profit per day leaderboard
- `GET /api/leaderboard/total-profit` - Total profit leaderboard
- `GET /api/reaction-times/stats` - Reaction time analytics
- `POST /api/export/csv` - Export leaderboard data to CSV

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Type checking
npm run check
```

## Data Flow

1. **Data Fetching** (every 5-10s): APIs → dataFetcher → MongoDB (market_snapshots)
2. **Detection**: arbitrageDetector analyzes snapshots → Creates arbitrage_opportunities
3. **Tracking**: reactionTracker monitors active opportunities → Updates reaction_tracking
4. **Analytics**: leaderboard generates rankings from stored data
5. **Frontend**: React queries API endpoints → Displays real-time dashboard

## Future Enhancements

This system is designed to be modular and reusable for building a full arbitrage trading bot:
- Add automated trading execution
- Implement risk management strategies
- Add webhook notifications for high-value opportunities
- Expand to additional prediction market platforms
- Add backtesting capabilities with historical data

## License

MIT

## Contributing

This is a test/analytics system. For production trading, ensure proper risk management and compliance with platform terms of service.
