import { HoldingCalculated, HoldingLot, MarketQuote, AssetCategory } from '../types/investment';

export interface PortfolioSummary {
  totalCostBasis: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  totalDayGainLoss: number;
  totalDayGainLossPercent: number;
  categoryBreakdown: Record<AssetCategory, { value: number; costBasis: number; count: number }>;
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
  const dayGainLoss = holding.shares * dayChangePerShare;
  const dayGainLossPercent = quote?.changePercent ?? 0;

  const fiftyTwoWeekHigh = (quote?.fiftyTwoWeekHigh && quote.fiftyTwoWeekHigh > 0) ? quote.fiftyTwoWeekHigh : currentPrice;
  const fiftyTwoWeekLow = (quote?.fiftyTwoWeekLow && quote.fiftyTwoWeekLow > 0) ? quote.fiftyTwoWeekLow : currentPrice;
  const percentOf52WkHigh = fiftyTwoWeekHigh > 0 ? (currentPrice / fiftyTwoWeekHigh) * 100 : 100;

  return {
    ...holding,
    currentPrice,
    costBasis,
    currentValue,
    unrealizedGainLoss,
    unrealizedGainLossPercent,
    dayGainLoss,
    dayGainLossPercent,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
    percentOf52WkHigh,
    peRatio: quote?.peRatio,
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

  for (const h of holdings) {
    totalCostBasis += h.costBasis;
    totalCurrentValue += h.currentValue;
    totalDayGainLoss += h.dayGainLoss;

    const cat = h.category in categoryBreakdown ? h.category : 'Stock';
    categoryBreakdown[cat].value += h.currentValue;
    categoryBreakdown[cat].costBasis += h.costBasis;
    categoryBreakdown[cat].count += 1;
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
  };
}
