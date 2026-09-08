# Investment Tracker & Strategy Simulator

A full-featured portfolio tracking, 52-week high strategy decision engine, and systematic grid-buying simulator.

Part of the **FinancialStuff** monorepo.

---

## Features

* **Multi-Asset Holdings & Lot Tracker**:
  * Tracks Stocks, High-Dividend Equities, Berkshire Portfolio, ETFs, and Mutual Funds (including Fidelity zero-fee index funds like `FZROX`, `FNILX`, `FXAIX`).
  * Supports multiple accounts (Taxable Brokerage, Roth IRA, 401(k), Partner/Family) with an "All Accounts (Combined)" aggregation rollup.
  * Preserves individual tax lots: tracks purchase dates, purchase prices, cost basis, intraday change, and unrealized gain/loss ($ and %).
* **52-Week High Strategy Watchlist (`Buy_List` Engine)**:
  * Visual 52-Week Price Range bar with target threshold markers.
  * Computes percentage of 52-week high (`@52wk-H`).
  * Emits automated `BUY SIGNAL`, `NEAR TARGET`, or `WAIT / HOLD` decision badges when prices dip below configurable target percentages (e.g. `< 67.4%` of 52-week High).
* **Return Estimation Grid Simulator (`ReturnEstimation`)**:
  * Interactive scenario model for systematic dollar-cost averaging down as asset prices drop from a 52-week high.
  * Calculates holding duration (`cycle_years * buy_pct * sell_pct`), proceeds, and overall strategy ROI across multiple buying tiers.
* **Persistent Cache & Stale-Data Indicator (Vercel Ready)**:
  * Persistent local storage with timestamped snapshots.
  * Header displays data freshness: 🟢 Live, 🟡 Stale / Market Closed ("Data from [Time] — Please Refresh"), or 🔴 Offline.
  * Zero fabricated mock data: all prices reflect real market quotes.

---

## Directory Architecture

```
investment-tracker/
├── backend/                       # Python FastAPI market data service
│   ├── main.py                    # API endpoints (/api/health, /api/quote, /api/quotes)
│   ├── market_service.py          # yfinance fetcher + file cache
│   └── requirements.txt           # fastapi, uvicorn, yfinance
├── frontend/                      # React + TypeScript + Vite web app
│   ├── package.json
│   ├── vite.config.ts             # Proxies /api calls to backend (port 8000)
│   ├── src/
│   │   ├── engine/                # Grid math & portfolio aggregations
│   │   ├── services/              # LocalStorage & Market API client
│   │   ├── components/            # UI components, tables, range bars, modals
│   │   └── App.tsx
│   └── index.html
└── README.md
```

---

## Getting Started

### 1. Prerequisites
* **Node.js** (v18 or higher) & `npm`
* **Python** (3.11 or higher) & `pip`

---

### 2. Running the Market Data Backend (Optional for live quotes)

The FastAPI backend fetches real-time quotes, 52-week ranges, and mutual fund NAVs from Yahoo Finance with local caching.

**Using Pipenv:**
```bash
cd investment-tracker/backend
pipenv install
pipenv run python main.py
```

**Or using standard Pip:**
```bash
cd investment-tracker/backend
pip install -r requirements.txt
python main.py
```
*The backend starts at `http://localhost:8000`.*

---

### 3. Running the Frontend Dashboard

```bash
cd investment-tracker/frontend
npm install
npm run dev
```
*Open **`http://localhost:3001`** in your browser.*

> [!NOTE]
> Even if the backend server is not running, the frontend will seamlessly render your saved portfolio and custom watchlist using cached real quotes with a clear status indicator.
