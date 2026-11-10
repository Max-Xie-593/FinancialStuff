import { Account, HoldingLot, MarketQuote, WatchlistStock, GridSimInputs } from '../types/investment';
import { DEFAULT_GRID_INPUTS } from '../engine/gridEngine';
import { authService } from './authService';
import { getApiBaseUrl } from './marketApi';

const STORAGE_KEYS = {
  ACCOUNTS: 'it_accounts',
  HOLDINGS: 'it_holdings',
  WATCHLIST: 'it_watchlist',
  QUOTES: 'it_quotes_cache',
  GRID_INPUTS: 'it_grid_inputs',
  ACTIVE_ACCOUNT: 'it_active_account_id',
};

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc_taxable', name: 'Taxable Brokerage', type: 'Taxable', description: 'Primary individual investing account' },
  { id: 'acc_roth', name: 'Roth IRA', type: 'Roth IRA', description: 'Tax-exempt retirement account' },
  { id: 'acc_person_b', name: 'Family / Secondary', type: 'Personal', description: 'Secondary portfolio / partner account' },
];

const DEFAULT_HOLDINGS: HoldingLot[] = [
  // Primary Taxable Account
  { id: 'lot-1', accountId: 'acc_taxable', symbol: 'AAL', name: 'American Airlines Group', category: 'Stock', shares: 200, purchasePrice: 15.62, purchaseDate: '2022-02-25' },
  { id: 'lot-2', accountId: 'acc_taxable', symbol: 'AMAT', name: 'Applied Materials Inc.', category: 'Stock', shares: 100, purchasePrice: 164.60, purchaseDate: '2025-02-26' },
  { id: 'lot-3', accountId: 'acc_taxable', symbol: 'AMD', name: 'Advanced Micro Devices', category: 'Stock', shares: 100, purchasePrice: 102.00, purchaseDate: '2022-03-08' },
  { id: 'lot-4', accountId: 'acc_taxable', symbol: 'DVN', name: 'Devon Energy Corp.', category: 'Dividend', shares: 100, purchasePrice: 52.00, purchaseDate: '2023-01-15' },
  { id: 'lot-5', accountId: 'acc_taxable', symbol: 'KO', name: 'The Coca-Cola Company', category: 'Berkshire', shares: 100, purchasePrice: 58.50, purchaseDate: '2023-02-10' },
  { id: 'lot-6', accountId: 'acc_taxable', symbol: 'FNCL', name: 'Fidelity MSCI Financials ETF', category: 'ETF', shares: 400, purchasePrice: 44.46, purchaseDate: '2022-06-13' },
  { id: 'lot-7', accountId: 'acc_taxable', symbol: 'FTEC', name: 'Fidelity MSCI Info Tech ETF', category: 'ETF', shares: 300, purchasePrice: 96.00, purchaseDate: '2022-06-13' },
  { id: 'lot-8', accountId: 'acc_taxable', symbol: 'IVV', name: 'iShares Core S&P 500 ETF', category: 'ETF', shares: 140, purchasePrice: 372.25, purchaseDate: '2022-06-13' },
  { id: 'lot-9', accountId: 'acc_taxable', symbol: 'FZROX', name: 'Fidelity ZERO Total Market Index', category: 'MutualFund', shares: 250, purchasePrice: 16.50, purchaseDate: '2023-03-01' },
  { id: 'lot-10', accountId: 'acc_taxable', symbol: 'FXAIX', name: 'Fidelity 500 Index Fund', category: 'MutualFund', shares: 100, purchasePrice: 165.00, purchaseDate: '2023-03-01' },

  // Roth IRA Account
  { id: 'lot-11', accountId: 'acc_roth', symbol: 'FNILX', name: 'Fidelity ZERO Large Cap Index', category: 'MutualFund', shares: 300, purchasePrice: 15.00, purchaseDate: '2023-01-10' },
  { id: 'lot-12', accountId: 'acc_roth', symbol: 'IVV', name: 'iShares Core S&P 500 ETF', category: 'ETF', shares: 50, purchasePrice: 430.00, purchaseDate: '2024-01-15' },

  // Secondary / Partner Account
  { id: 'lot-13', accountId: 'acc_person_b', symbol: 'AMAT', name: 'Applied Materials Inc.', category: 'Stock', shares: 25, purchasePrice: 195.00, purchaseDate: '2024-06-01' },
  { id: 'lot-14', accountId: 'acc_person_b', symbol: 'AMD', name: 'Advanced Micro Devices', category: 'Stock', shares: 50, purchasePrice: 145.00, purchaseDate: '2024-04-10' },
];

const DEFAULT_WATCHLIST: WatchlistStock[] = [
  { symbol: 'ACLS', name: 'Axcelis Technologies', targetBuyPctOfHigh: 0.674, notes: 'Target < 67.4% of 52w High' },
  { symbol: 'AMAT', name: 'Applied Materials', targetBuyPctOfHigh: 0.674, notes: 'Core semi equipment buy tier' },
  { symbol: 'ASML', name: 'ASML Holding NV', targetBuyPctOfHigh: 0.674, notes: 'Monopoly lithography supplier' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', targetBuyPctOfHigh: 0.700, notes: 'Data center AI tailwind' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', targetBuyPctOfHigh: 0.750, notes: 'Cloud / AWS infrastructure' },
  { symbol: 'GOOG', name: 'Alphabet Inc.', targetBuyPctOfHigh: 0.700, notes: 'Berkshire portfolio & AI search' },
];

// Seed cached market quotes with realistic snapshot and sector/industry so the app renders immediately
const DEFAULT_CACHED_QUOTES: Record<string, MarketQuote> = {
  AAL: { symbol: 'AAL', name: 'American Airlines Group', price: 11.85, change: -0.15, changePercent: -1.25, fiftyTwoWeekHigh: 16.15, fiftyTwoWeekLow: 9.07, peRatio: 8.4, sector: 'Industrials', industry: 'Airlines', lastUpdated: '2026-09-08T12:00:00Z', isStale: true },
  AMAT: { symbol: 'AMAT', name: 'Applied Materials Inc.', price: 198.40, change: 3.20, changePercent: 1.64, fiftyTwoWeekHigh: 255.89, fiftyTwoWeekLow: 142.30, peRatio: 24.1, sector: 'Technology', industry: 'Semiconductor Equipment', lastUpdated: '2026-09-08T12:00:00Z', isStale: true },
  AMD: { symbol: 'AMD', name: 'Advanced Micro Devices', price: 148.60, change: -1.40, changePercent: -0.93, fiftyTwoWeekHigh: 227.30, fiftyTwoWeekLow: 94.04, peRatio: 48.2, sector: 'Technology', industry: 'Semiconductors', lastUpdated: '2026-09-08T12:00:00Z', isStale: true },
  DVN: { symbol: 'DVN', name: 'Devon Energy Corp.', price: 44.50, change: 0.35, changePercent: 0.79, fiftyTwoWeekHigh: 55.08, fiftyTwoWeekLow: 37.25, peRatio: 8.9, sector: 'Energy', industry: 'Oil & Gas E&P', lastUpdated: '2026-09-08T12:00:00Z', isStale: true },
  KO: { symbol: 'KO', name: 'The Coca-Cola Company', price: 71.20, change: 0.45, changePercent: 0.64, fiftyTwoWeekHigh: 73.50, fiftyTwoWeekLow: 51.55, peRatio: 26.5, sector: 'Consumer Defensive', industry: 'Beverages', lastUpdated: '2026-09-08T12:00:00Z', isStale: true },
  FNCL: { symbol: 'FNCL', name: 'Fidelity MSCI Financials ETF', price: 62.80, change: 0.30, changePercent: 0.48, fiftyTwoWeekHigh: 64.50, fiftyTwoWeekLow: 47.10, peRatio: 14.8, sector: 'Financials', industry: 'Financials ETF', lastUpdated: '2026-09-08T12:00:00Z', isStale: true },
  FTEC: { symbol: 'FTEC', name: 'Fidelity MSCI Info Tech ETF', price: 172.50, change: 1.80, changePercent: 1.05, fiftyTwoWeekHigh: 185.00, fiftyTwoWeekLow: 124.00, peRatio: 31.2, sector: 'Technology', industry: 'Technology ETF', lastUpdated: '2026-09-08T12:00:00Z', isStale: true },
  IVV: { symbol: 'IVV', name: 'iShares Core S&P 500 ETF', price: 552.10, change: 2.40, changePercent: 0.44, fiftyTwoWeekHigh: 565.16, fiftyTwoWeekLow: 410.07, peRatio: 27.8, sector: 'Large Cap Blend', industry: 'S&P 500 Index ETF', lastUpdated: '2026-09-08T12:00:00Z', isStale: true },
  FZROX: { symbol: 'FZROX', name: 'Fidelity ZERO Total Market Index', price: 21.45, change: 0.10, changePercent: 0.47, fiftyTwoWeekHigh: 22.10, fiftyTwoWeekLow: 15.80, peRatio: null, sector: 'Total Stock Market', industry: 'Broad Market Fund', lastUpdated: '2026-09-08T12:00:00Z', isStale: true },
  FXAIX: { symbol: 'FXAIX', name: 'Fidelity 500 Index Fund', price: 202.30, change: 0.90, changePercent: 0.45, fiftyTwoWeekHigh: 207.15, fiftyTwoWeekLow: 150.25, peRatio: null, sector: 'Large Cap Blend', industry: 'S&P 500 Index Fund', lastUpdated: '2026-09-08T12:00:00Z', isStale: true },
  FNILX: { symbol: 'FNILX', name: 'Fidelity ZERO Large Cap Index', price: 20.80, change: 0.08, changePercent: 0.39, fiftyTwoWeekHigh: 21.30, fiftyTwoWeekLow: 15.40, peRatio: null, sector: 'Large Cap Blend', industry: 'Large Cap Index Fund', lastUpdated: '2026-09-08T12:00:00Z', isStale: true },
  ACLS: { symbol: 'ACLS', name: 'Axcelis Technologies', price: 82.40, change: -1.20, changePercent: -1.44, fiftyTwoWeekHigh: 155.00, fiftyTwoWeekLow: 75.00, peRatio: 16.5, sector: 'Technology', industry: 'Semiconductor Equipment', lastUpdated: '2026-09-08T12:00:00Z', isStale: true },
  ASML: { symbol: 'ASML', name: 'ASML Holding NV', price: 780.00, change: 12.00, changePercent: 1.56, fiftyTwoWeekHigh: 1110.09, fiftyTwoWeekLow: 645.00, peRatio: 38.4, sector: 'Technology', industry: 'Semiconductor Lithography', lastUpdated: '2026-09-08T12:00:00Z', isStale: true },
  AMZN: { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 186.50, change: 2.10, changePercent: 1.14, fiftyTwoWeekHigh: 201.20, fiftyTwoWeekLow: 118.35, peRatio: 42.1, sector: 'Consumer Cyclical', industry: 'Internet Retail & Cloud', lastUpdated: '2026-09-08T12:00:00Z', isStale: true },
  GOOG: { symbol: 'GOOG', name: 'Alphabet Inc.', price: 162.30, change: -0.80, changePercent: -0.49, fiftyTwoWeekHigh: 191.75, fiftyTwoWeekLow: 120.21, peRatio: 22.8, sector: 'Communication Services', industry: 'Internet Content & Info', lastUpdated: '2026-09-08T12:00:00Z', isStale: true },
};

function getKey(baseKey: string, userId?: string): string {
  const effectiveUser = userId || authService.getSession()?.user.id;
  if (!effectiveUser || effectiveUser === 'guest') {
    return baseKey;
  }
  return `it_user_${effectiveUser}_${baseKey}`;
}

export const storageService = {
  getAccounts(userId?: string): Account[] {
    const key = getKey(STORAGE_KEYS.ACCOUNTS, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      this.saveAccounts(DEFAULT_ACCOUNTS, userId);
      return DEFAULT_ACCOUNTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  },

  saveAccounts(accounts: Account[], userId?: string) {
    const key = getKey(STORAGE_KEYS.ACCOUNTS, userId);
    localStorage.setItem(key, JSON.stringify(accounts));
  },

  getActiveAccountId(userId?: string): string {
    const key = getKey(STORAGE_KEYS.ACTIVE_ACCOUNT, userId);
    return localStorage.getItem(key) || 'ALL';
  },

  setActiveAccountId(id: string, userId?: string) {
    const key = getKey(STORAGE_KEYS.ACTIVE_ACCOUNT, userId);
    localStorage.setItem(key, id);
  },

  getHoldings(userId?: string): HoldingLot[] {
    const key = getKey(STORAGE_KEYS.HOLDINGS, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      this.saveHoldings(DEFAULT_HOLDINGS, userId);
      return DEFAULT_HOLDINGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_HOLDINGS;
    }
  },

  saveHoldings(holdings: HoldingLot[], userId?: string) {
    const key = getKey(STORAGE_KEYS.HOLDINGS, userId);
    localStorage.setItem(key, JSON.stringify(holdings));
  },

  getWatchlist(userId?: string): WatchlistStock[] {
    const key = getKey(STORAGE_KEYS.WATCHLIST, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      this.saveWatchlist(DEFAULT_WATCHLIST, userId);
      return DEFAULT_WATCHLIST;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_WATCHLIST;
    }
  },

  saveWatchlist(watchlist: WatchlistStock[], userId?: string) {
    const key = getKey(STORAGE_KEYS.WATCHLIST, userId);
    localStorage.setItem(key, JSON.stringify(watchlist));
  },

  // Quotes are shared globally across all users to conserve API requests
  getCachedQuotes(): Record<string, MarketQuote> {
    const raw = localStorage.getItem(STORAGE_KEYS.QUOTES);
    if (!raw) {
      this.saveCachedQuotes(DEFAULT_CACHED_QUOTES);
      return DEFAULT_CACHED_QUOTES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CACHED_QUOTES;
    }
  },

  saveCachedQuotes(quotes: Record<string, MarketQuote>) {
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
  },

  getGridInputs(userId?: string): GridSimInputs {
    const key = getKey(STORAGE_KEYS.GRID_INPUTS, userId);
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_GRID_INPUTS;
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_GRID_INPUTS;
    }
  },

  saveGridInputs(inputs: GridSimInputs, userId?: string) {
    const key = getKey(STORAGE_KEYS.GRID_INPUTS, userId);
    localStorage.setItem(key, JSON.stringify(inputs));
  },

  /**
   * Syncs user portfolio with the backend database if online and authenticated
   */
  async syncWithBackend(_userId: string, data: {
    accounts: Account[];
    holdings: HoldingLot[];
    watchlist: WatchlistStock[];
    gridInputs: GridSimInputs;
  }): Promise<void> {
    const headers = authService.getAuthHeaders();
    if (!headers.Authorization) return;

    try {
      await fetch(`${getApiBaseUrl()}/user/portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ portfolio: data }),
        signal: AbortSignal.timeout(3000),
      });
    } catch (e: any) {
      console.warn('[StorageService] Background cloud sync skipped:', e.message);
    }
  },

  /**
   * Fetches user portfolio from backend database if online and authenticated
   */
  async fetchFromBackend(_userId: string): Promise<{
    accounts: Account[];
    holdings: HoldingLot[];
    watchlist: WatchlistStock[];
    gridInputs: GridSimInputs;
  } | null> {
    const headers = authService.getAuthHeaders();
    if (!headers.Authorization) return null;

    try {
      const res = await fetch(`${getApiBaseUrl()}/user/portfolio`, {
        headers,
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const body = await res.json();
        if (body.portfolio && Array.isArray(body.portfolio.holdings)) {
          return body.portfolio;
        }
      }
    } catch (e: any) {
      console.warn('[StorageService] Backend load skipped:', e.message);
    }
    return null;
  }
};
