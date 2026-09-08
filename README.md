# FinancialStuff

A monorepo for financial modeling tools, simulators, and investment tracking applications.

---

## Repository Structure

```
FinancialStuff/
├── README.md
├── .gitignore
├── personal-finance-planner/         # [React + TypeScript + Vite] 60-Year Wealth Engine
│   ├── package.json                  # Dependency manifest (Node.js equivalent of Pipfile)
│   ├── package-lock.json             # Exact dependency lockfile (equivalent of Pipfile.lock)
│   ├── vite.config.js                # Vite build configuration
│   └── src/
│       ├── engine/                   # Pure TypeScript 60-Year financial math engine
│       ├── components/               # Charts, Sliders, Ledger, and Budget Envelopes
│       └── App.tsx                   # Main React application
└── investment-tracker/               # [React + Vite + FastAPI] Portfolio tracker & grid-buy simulator
    ├── backend/                      # Python FastAPI market data service (yfinance + cache)
    └── frontend/                     # React + TypeScript portfolio dashboard & grid engine
```

---

## Packages

### 1. Personal Finance Planner
60-year projection engine simulating salary growth, 401(k), Roth IRA conversion windows, and progressive taxes.

```bash
cd personal-finance-planner
npm install
npm run dev
```
Runs on `http://localhost:3000`.

---

### 2. Investment Tracker & Strategy Simulator
Multi-asset portfolio tracker (Stocks, Dividend, Berkshire, ETFs, Mutual Funds), 52-Week High strategy watchlist with automated buy signals, and systematic DCA grid simulator.

**Backend (Optional for Live Quotes):**
```bash
cd investment-tracker/backend
# Using Pipenv:
pipenv install
pipenv run python main.py

# Or standard Pip:
pip install -r requirements.txt
python main.py
```
Runs on `http://localhost:8000`.

**Frontend Dashboard:**
```bash
cd investment-tracker/frontend
npm install
npm run dev
```
Runs on `http://localhost:3001`.

---

## Production Builds

* **Personal Finance Planner:** `cd personal-finance-planner && npm run build` (outputs to `dist/`)
* **Investment Tracker:** `cd investment-tracker/frontend && npm run build` (outputs to `dist/`)
