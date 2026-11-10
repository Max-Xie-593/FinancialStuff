import { HoldingCalculated, HoldingLot, MarketQuote, AssetCategory } from '../types/investment';

export const KNOWN_METADATA: Record<string, { sector: string; industry: string; name?: string }> = {
  // Index & Sector ETFs
  IVV: { name: 'iShares Core S&P 500 ETF', sector: 'Large Cap Blend', industry: 'S&P 500 Index ETF' },
  VOO: { name: 'Vanguard S&P 500 ETF', sector: 'Large Cap Blend', industry: 'S&P 500 Index ETF' },
  SPY: { name: 'SPDR S&P 500 ETF Trust', sector: 'Large Cap Blend', industry: 'S&P 500 Index ETF' },
  VTI: { name: 'Vanguard Total Stock Market ETF', sector: 'Total Stock Market', industry: 'Broad Market ETF' },
  QQQ: { name: 'Invesco QQQ Trust', sector: 'Technology', industry: 'Large Cap Growth ETF' },
  FNCL: { name: 'Fidelity MSCI Financials ETF', sector: 'Financials', industry: 'Financials ETF' },
  FTEC: { name: 'Fidelity MSCI Info Tech ETF', sector: 'Technology', industry: 'Technology ETF' },
  SCHD: { name: 'Schwab U.S. Dividend Equity ETF', sector: 'Large Value', industry: 'Dividend ETF' },
  VUG: { name: 'Vanguard Growth ETF', sector: 'Large Cap Growth', industry: 'Growth Index ETF' },
  VTV: { name: 'Vanguard Value ETF', sector: 'Large Cap Value', industry: 'Value Index ETF' },
  IWM: { name: 'iShares Russell 2000 ETF', sector: 'Small Cap Blend', industry: 'Small Cap ETF' },
  VXUS: { name: 'Vanguard Total International Stock ETF', sector: 'International Blend', industry: 'Foreign Large Cap ETF' },
  BND: { name: 'Vanguard Total Bond Market ETF', sector: 'Fixed Income', industry: 'Total Bond Market ETF' },
  AGG: { name: 'iShares Core U.S. Aggregate Bond ETF', sector: 'Fixed Income', industry: 'Core Bond ETF' },

  // Index Mutual Funds
  FZROX: { name: 'Fidelity ZERO Total Market Index', sector: 'Total Stock Market', industry: 'Broad Market Fund' },
  FXAIX: { name: 'Fidelity 500 Index Fund', sector: 'Large Cap Blend', industry: 'S&P 500 Index Fund' },
  FNILX: { name: 'Fidelity ZERO Large Cap Index', sector: 'Large Cap Blend', industry: 'Large Cap Index Fund' },
  FSKAX: { name: 'Fidelity Total Market Index Fund', sector: 'Total Stock Market', industry: 'Broad Market Fund' },
  VFIAX: { name: 'Vanguard 500 Index Fund Admiral', sector: 'Large Cap Blend', industry: 'S&P 500 Index Fund' },
  VTSAX: { name: 'Vanguard Total Stock Market Index Fund', sector: 'Total Stock Market', industry: 'Broad Market Fund' },
  VBTLX: { name: 'Vanguard Total Bond Market Index Fund', sector: 'Fixed Income', industry: 'Total Bond Fund' },

  // Equities
  AAL: { name: 'American Airlines Group', sector: 'Industrials', industry: 'Airlines' },
  AMAT: { name: 'Applied Materials Inc.', sector: 'Technology', industry: 'Semiconductor Equipment' },
  AMD: { name: 'Advanced Micro Devices', sector: 'Technology', industry: 'Semiconductors' },
  DVN: { name: 'Devon Energy Corp.', sector: 'Energy', industry: 'Oil & Gas E&P' },
  KO: { name: 'The Coca-Cola Company', sector: 'Consumer Defensive', industry: 'Beverages' },
  ACLS: { name: 'Axcelis Technologies', sector: 'Technology', industry: 'Semiconductor Equipment' },
  ASML: { name: 'ASML Holding NV', sector: 'Technology', industry: 'Semiconductor Lithography' },
  AMZN: { name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', industry: 'Internet Retail & Cloud' },
  GOOG: { name: 'Alphabet Inc.', sector: 'Communication Services', industry: 'Internet Content & Info' },
  AAPL: { name: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics' },
  MSFT: { name: 'Microsoft Corporation', sector: 'Technology', industry: 'Software - Infrastructure' },
  NVDA: { name: 'NVIDIA Corporation', sector: 'Technology', industry: 'Semiconductors' },
  TSLA: { name: 'Tesla, Inc.', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers' },
};

export interface PortfolioSummary {
  totalCostBasis: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  totalDayGainLoss: number;
  totalDayGainLossPercent: number;
  categoryBreakdown: Record<AssetCategory, { value: number; costBasis: number; count: number }>;
  sectorBreakdown: Record<string, { value: number; costBasis: number; count: number }>;
}

export function deduceFundMetadata(name: string, category: string): { sector: string; industry: string } {
  const n = (name || '').toLowerCase();
  const isETF = category === 'ETF';
  const suffix = isETF ? 'ETF' : 'Fund';

  if (n.includes('s&p 500') || n.includes('500 index') || n.includes('sp 500')) {
    return { sector: 'Large Cap Blend', industry: `S&P 500 Index ${suffix}` };
  }
  if (n.includes('total market') || n.includes('total stock') || n.includes('zero total')) {
    return { sector: 'Total Stock Market', industry: `Broad Market ${suffix}` };
  }
  if (n.includes('nasdaq') || n.includes('qqq') || n.includes('tech') || n.includes('info tech')) {
    return { sector: 'Technology', industry: `Technology ${suffix}` };
  }
  if (n.includes('financial')) {
    return { sector: 'Financials', industry: `Financials ${suffix}` };
  }
  if (n.includes('dividend')) {
    return { sector: 'Large Cap Value', industry: `Dividend ${suffix}` };
  }
  if (n.includes('growth')) {
    return { sector: 'Large Cap Growth', industry: `Growth ${suffix}` };
  }
  if (n.includes('value')) {
    return { sector: 'Large Cap Value', industry: `Value ${suffix}` };
  }
  if (n.includes('health')) {
    return { sector: 'Healthcare', industry: `Healthcare ${suffix}` };
  }
  if (n.includes('energy')) {
    return { sector: 'Energy', industry: `Energy ${suffix}` };
  }
  if (n.includes('small cap') || n.includes('russell 2000')) {
    return { sector: 'Small Cap Blend', industry: `Small Cap ${suffix}` };
  }
  if (n.includes('international') || n.includes('foreign') || n.includes('emerging') || n.includes('global')) {
    return { sector: 'International Blend', industry: `International ${suffix}` };
  }
  if (n.includes('bond') || n.includes('treasury') || n.includes('fixed income')) {
    return { sector: 'Fixed Income', industry: `Bond ${suffix}` };
  }
  if (n.includes('real estate') || n.includes('reit')) {
    return { sector: 'Real Estate', industry: `Real Estate ${suffix}` };
  }
  return {
    sector: isETF ? 'Large Cap Blend' : 'Mutual Funds',
    industry: isETF ? 'Index ETF' : 'Index Fund',
  };
}

export function calculateHoldingMetrics(
  holding: HoldingLot,
  quotes: Record<string, MarketQuote>
): HoldingCalculated {
  const quote = quotes[holding.symbol.toUpperCase()];
  const currentPrice = (quote?.price && quote.price > 0) ? quote.price : holding.purchasePrice;
  const costBasis = holding.shares * holding.purchasePrice;
  const currentValue = holding.shares * currentPrice;
  const unrealizedGainLoss = currentValue - costBasis;
  const unrealizedGainLossPercent = costBasis > 0 ? (unrealizedGainLoss / costBasis) * 100 : 0;

  const dayChangePerShare = quote?.change ?? 0;
  const dayChangePerSharePercent = quote?.changePercent ?? 0;
  const dayGainLoss = holding.shares * dayChangePerShare;
  const dayGainLossPercent = dayChangePerSharePercent;

  const fiftyTwoWeekHigh = (quote?.fiftyTwoWeekHigh && quote.fiftyTwoWeekHigh > 0) ? quote.fiftyTwoWeekHigh : currentPrice;
  const fiftyTwoWeekLow = (quote?.fiftyTwoWeekLow && quote.fiftyTwoWeekLow > 0) ? quote.fiftyTwoWeekLow : currentPrice;
  const percentOf52WkHigh = fiftyTwoWeekHigh > 0 ? (currentPrice / fiftyTwoWeekHigh) * 100 : 100;

  const sym = holding.symbol.toUpperCase();
  const known = KNOWN_METADATA[sym];

  // 1. Resolve Sector: holding explicit override -> quote sector -> known metadata -> fund deduction -> category fallback
  let sector = holding.sector || quote?.sector;
  if (!sector || ['ETF', 'ETFS', 'OTHER', 'MUTUAL FUND', 'MUTUALFUND'].includes(sector.toUpperCase())) {
    if (known?.sector) {
      sector = known.sector;
    } else if (holding.category === 'ETF' || holding.category === 'MutualFund') {
      sector = deduceFundMetadata(holding.name || quote?.name || '', holding.category).sector;
    } else {
      sector = holding.category === 'Stock' ? 'Equities' : (holding.category === 'Berkshire' ? 'Berkshire Holdings' : holding.category);
    }
  }

  // 2. Resolve Industry: holding explicit override -> quote industry -> known metadata -> fund deduction -> category fallback
  let industry = holding.industry || quote?.industry;
  if (!industry || ['ETF', 'ETFS', 'OTHER', 'MUTUAL FUND', 'MUTUALFUND'].includes(industry.toUpperCase()) || industry === sector) {
    if (known?.industry) {
      industry = known.industry;
    } else if (holding.category === 'ETF' || holding.category === 'MutualFund') {
      industry = deduceFundMetadata(holding.name || quote?.name || '', holding.category).industry;
    } else {
      industry = holding.category === 'Stock' ? 'General Equity' : (holding.category === 'Dividend' ? 'High Yield Equity' : sector);
    }
  }

  return {
    ...holding,
    currentPrice,
    costBasis,
    currentValue,
    unrealizedGainLoss,
    unrealizedGainLossPercent,
    dayChangePerShare,
    dayChangePerSharePercent,
    dayGainLoss,
    dayGainLossPercent,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
    percentOf52WkHigh,
    peRatio: quote?.peRatio,
    sector,
    industry,
    quoteLastUpdated: quote?.lastUpdated,
    isStale: quote?.isStale,
  };
}

export function aggregatePortfolio(holdings: HoldingCalculated[]): PortfolioSummary {
  let totalCostBasis = 0;
  let totalCurrentValue = 0;
  let totalDayGainLoss = 0;

  const categoryBreakdown: Record<AssetCategory, { value: number; costBasis: number; count: number }> = {
    Stock: { value: 0, costBasis: 0, count: 0 },
    Dividend: { value: 0, costBasis: 0, count: 0 },
    Berkshire: { value: 0, costBasis: 0, count: 0 },
    ETF: { value: 0, costBasis: 0, count: 0 },
    MutualFund: { value: 0, costBasis: 0, count: 0 },
  };

  const sectorBreakdown: Record<string, { value: number; costBasis: number; count: number }> = {};

  for (const h of holdings) {
    totalCostBasis += h.costBasis;
    totalCurrentValue += h.currentValue;
    totalDayGainLoss += h.dayGainLoss;

    const cat = h.category in categoryBreakdown ? h.category : 'Stock';
    categoryBreakdown[cat].value += h.currentValue;
    categoryBreakdown[cat].costBasis += h.costBasis;
    categoryBreakdown[cat].count += 1;

    const sec = h.sector || 'Other';
    if (!sectorBreakdown[sec]) {
      sectorBreakdown[sec] = { value: 0, costBasis: 0, count: 0 };
    }
    sectorBreakdown[sec].value += h.currentValue;
    sectorBreakdown[sec].costBasis += h.costBasis;
    sectorBreakdown[sec].count += 1;
  }

  const totalGainLoss = totalCurrentValue - totalCostBasis;
  const totalGainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;
  const prevDayTotalValue = totalCurrentValue - totalDayGainLoss;
  const totalDayGainLossPercent = prevDayTotalValue > 0 ? (totalDayGainLoss / prevDayTotalValue) * 100 : 0;

  return {
    totalCostBasis,
    totalCurrentValue,
    totalGainLoss,
    totalGainLossPercent,
    totalDayGainLoss,
    totalDayGainLossPercent,
    categoryBreakdown,
    sectorBreakdown,
  };
}
