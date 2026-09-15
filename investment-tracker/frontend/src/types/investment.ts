// Data definitions for Accounts, Holdings, Market Quotes, Watchlist & Grid Simulator

export type AssetCategory = 'Stock' | 'Dividend' | 'Berkshire' | 'ETF' | 'MutualFund';

export interface Account {
  id: string;
  name: string;
  type: 'Taxable' | 'Roth IRA' | 'Traditional 401(k)' | 'Personal' | 'Other';
  description?: string;
}

export interface HoldingLot {
  id: string;
  accountId: string;
  symbol: string;
  name?: string;
  category: AssetCategory;
  shares: number;
  purchasePrice: number;
  purchaseDate: string; // YYYY-MM-DD
  notes?: string;
}

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  peRatio?: number | null;
  sector?: string;
  industry?: string;
  quoteType?: string;
  lastUpdated: string; // ISO string
  isStale?: boolean;
}

export interface HoldingCalculated extends HoldingLot {
  currentPrice: number;
  costBasis: number;
  currentValue: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
  dayGainLoss: number;
  dayGainLossPercent: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  percentOf52WkHigh: number;
  peRatio?: number | null;
  sector?: string;
  industry?: string;
  quoteLastUpdated?: string;
  isStale?: boolean;
}

export interface WatchlistStock {
  symbol: string;
  name?: string;
  targetBuyPctOfHigh: number; // e.g., 0.674 = 67.4%
  notes?: string;
}

export interface GridSimInputs {
  stepCash: number;       // e.g. $10,000
  high52wk: number;       // e.g. $318.82
  startBuyPct: number;    // e.g. 0.674 (67.4%)
  buyStepPct: number;     // e.g. 0.10 (10%)
  sellPct: number;        // e.g. 0.70 (70%)
  cycleYears: number;     // e.g. 7
  numTiers: number;       // e.g. 7
}

export interface GridSimTier {
  tier: number;
  cashInvested: number;
  buyPctOfHigh: number;
  buyPrice: number;
  sharesBought: number;
  sellPrice: number;
  yearsHeld: number;
  proceeds: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface GridSimSummary {
  totalCashInvested: number;
  totalProceeds: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  tiers: GridSimTier[];
}
