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
└── investment-tracker/               # [Future Package] Real-time market API & grid-buy simulator
```

---

## Getting Started: Personal Finance Planner

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* `npm` (included with Node.js)

### Installation (Equivalent of `pipenv install`)
To install all required packages (`react`, `recharts`, `lucide-react`, `vite`, `typescript`):

```bash
cd personal-finance-planner
npm install
```

### Running the Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### Building for Production
```bash
npm run build
```
The compiled, minified production assets will be generated in `personal-finance-planner/dist/`.
