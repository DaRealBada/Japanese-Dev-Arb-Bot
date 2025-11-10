# Design Guidelines: Real-Time Arbitrage Analytics Dashboard

## Design Approach: Data-Centric Dashboard System

**Selected Approach**: Design System (Carbon Design / Financial Dashboard Pattern)

**Justification**: This is a data-intensive analytics application requiring clarity, efficiency, and real-time updates. Drawing inspiration from professional trading platforms and analytics dashboards ensures optimal information density while maintaining usability.

**Key Design Principles**:
- Information hierarchy: Critical data (active arbitrage opportunities) prominently displayed
- Scanability: Dense information presented in digestible chunks
- Real-time clarity: Visual indicators for live updates and status changes
- Professional precision: Typography and spacing that convey reliability

---

## Core Design Elements

### A. Typography

**Font Family**: 
- Primary: Inter or IBM Plex Sans (via Google Fonts CDN)
- Monospace: JetBrains Mono or IBM Plex Mono for numerical data, prices, percentages

**Type Scale**:
- Page Title: text-3xl font-bold
- Section Headers: text-xl font-semibold
- Card Titles: text-lg font-medium
- Body/Labels: text-sm font-normal
- Data Values: text-base font-mono
- Metadata/Timestamps: text-xs font-normal

**Hierarchy Pattern**: Headers use sans-serif with medium-to-bold weights, while all numerical data (prices, percentages, timestamps) uses monospace fonts for alignment and readability.

---

### B. Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- Component padding: p-4 or p-6
- Section spacing: space-y-6 or space-y-8
- Card gaps: gap-4
- Tight spacing: space-y-2 (for related data points)

**Grid Structure**:
- Main dashboard: 12-column grid with sidebar
- Leaderboard cards: 2-column grid on desktop (lg:grid-cols-2), single column on mobile
- Opportunity cards: 3-column grid on large screens (lg:grid-cols-3), responsive collapse

**Container Strategy**:
- Max-width: max-w-7xl mx-auto px-4
- Full-width data tables and charts
- Contained cards and panels within max-width boundary

---

### C. Component Library

#### 1. Dashboard Layout Structure

**Top Navigation Bar**:
- Full-width fixed header with application title
- Real-time status indicator (connected/disconnected to data feeds)
- Last updated timestamp
- Quick filters: Platform selector chips (Polymarket, Limitless, Myriad, Kalshi)

**Left Sidebar** (collapsible on mobile):
- Navigation items: Dashboard, Active Opportunities, Leaderboards, Historical Data
- Filter controls: Profit threshold slider, Time range selector
- Status summary: Total opportunities tracked, Active arbitrages count

**Main Content Area**:
- Hero stats panel: 4-column grid showing key metrics (Total Profit %, Avg Reaction Time, Active Opportunities, Markets Monitored)
- Primary content sections with clear visual separation

#### 2. Active Opportunities Table

**Structure**: Data table with sortable columns
- Columns: Platform Pair | Market Event | Price Discrepancy | Profit % | Profit %/Day | Time Detected | Status
- Row design: Compact with clear borders, hover state for interaction
- Status badges: Small pill-shaped indicators (Active, Closing, Closed)
- Expandable rows: Click to reveal detailed price comparison and historical convergence chart

**Visual Treatment**:
- Sticky header for scrolling
- Alternating row subtle background distinction
- Bold monospace for percentage values
- Icon indicators from Heroicons for trend direction

#### 3. Leaderboard Components

**Dual Leaderboard Layout**: Side-by-side cards on desktop

**Leaderboard 1 - Profit % Per Day**:
- Ranked list (1-20) with numbered badges
- Each entry shows: Rank | Market Event | Platforms | Profit %/Day | Duration
- Top 3 entries with emphasized visual treatment (larger padding, subtle border)

**Leaderboard 2 - Total Profit %**:
- Same structure as Leaderboard 1
- Sorting by absolute profit percentage

**Card Design**:
- Border-based separation (border-2)
- Header with title and "Last Updated" timestamp
- Scrollable content area (max-h-96 overflow-y-auto)
- Empty state message when no data available

#### 4. Market Monitoring Cards

**Platform Status Cards**: 4-column grid (one per platform)
- Platform logo/name as header
- Current markets monitored count
- Last successful fetch timestamp
- API health indicator (icon from Heroicons)
- Active arbitrage opportunities count for this platform

#### 5. Reaction Time Tracker Display

**Time-to-Close Visualization**:
- Horizontal bar chart showing reaction times
- Each bar represents an arbitrage opportunity
- X-axis: Time in minutes/seconds
- Hover tooltip: Full details (market, platforms, exact time)

**Metrics Summary**:
- Average reaction time (large display, monospace)
- Fastest/slowest convergence times
- Distribution histogram (simple SVG chart via recharts or similar library)

#### 6. Forms and Controls

**Filter Panel**:
- Range slider for minimum profit threshold (0-100%)
- Multi-select dropdown for platform filtering
- Date range picker for historical analysis
- "Apply Filters" button with "Clear All" text link

**Search Input**:
- Full-width search bar with icon prefix (Heroicons magnifying-glass)
- Placeholder: "Search by market event, platform, or ID..."
- Clear button when text is present

---

### D. Data Visualization Patterns

**Real-Time Updates**:
- Subtle pulse animation on newly detected opportunities (animate-pulse applied for 3 seconds)
- Timestamp updates without full page refresh
- Color-agnostic status indicators using icon shapes (circle, square, triangle for different states)

**Price Comparison Displays**:
- Side-by-side price boxes showing Platform A price vs Platform B price
- Arrow icon between them indicating direction of arbitrage
- Calculated spread displayed prominently below

**Charts and Graphs** (using library like recharts):
- Line charts for price convergence over time
- Bar charts for reaction time distribution
- Minimal styling: thin lines, clear axis labels, grid lines for reference

---

## Accessibility & Responsiveness

**Accessibility Standards**:
- All interactive elements keyboard navigable
- ARIA labels on status indicators and icons
- Form inputs with proper labels and error states
- High contrast text and borders (no reliance on color alone)

**Responsive Breakpoints**:
- Mobile (base): Single column layout, collapsible sidebar, stacked cards
- Tablet (md): 2-column grids, visible sidebar
- Desktop (lg+): 3-column grids, full multi-column leaderboards, expanded tables

**Touch Targets**: Minimum 44x44px for buttons and interactive elements

---

## Asset Specifications

**Icons**: Heroicons (via CDN)
- chart-bar-icon for analytics sections
- clock-icon for timestamps and reaction times
- arrow-trending-up/down for price movements
- check-circle/exclamation-circle for status indicators
- funnel-icon for filters

**No Images Required**: This is a pure data application; all content is dynamically generated from market data.

---

## Critical Implementation Notes

- **Data Density**: Prioritize information over whitespace in tables and leaderboards
- **Update Indicators**: Subtle visual feedback when data refreshes (e.g., brief fade-in on updated values)
- **Performance**: Virtualized scrolling for long lists (react-window or similar)
- **Consistency**: Maintain strict alignment in data tables using monospace fonts
- **Loading States**: Skeleton screens for initial load, spinner for real-time updates

This dashboard design prioritizes rapid information scanning, clear data hierarchy, and professional presentation suitable for financial analytics applications.