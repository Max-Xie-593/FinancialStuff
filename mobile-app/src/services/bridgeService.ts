import { FinancialInputs } from '../engine/financeEngine';
import { Account, HoldingLot, MarketQuote } from '../types/investment';
import { calculateHoldingMetrics } from '../engine/portfolioEngine';

export interface PortfolioBalanceBridge {
  taxableTotal: number;
  rothTotal: number;
  tradIraOr401kTotal: number;
  cashTotal: number;
  grandTotal: number;
}

/**
 * Computes live portfolio breakdown categorized by account tax-vehicle
 * to feed directly into the Personal Finance Planner's initial starting balances.
 */
export function computePortfolioBridgeBalances(
  accounts: Account[],
  holdings: HoldingLot[],
  quotes: Record<string, MarketQuote>
): PortfolioBalanceBridge {
  let taxableTotal = 0;
  let rothTotal = 0;
  let tradIraOr401kTotal = 0;
  let cashTotal = 0;

  // Map each account to its type
  const accountTypeMap = new Map<string, string>();
  accounts.forEach((acc) => {
    accountTypeMap.set(acc.id, acc.type);
  });

  // Calculate market value of each lot
  holdings.forEach((lot) => {
    const accType = accountTypeMap.get(lot.accountId) || 'Taxable';
    const metrics = calculateHoldingMetrics(lot, quotes);
    const value = metrics.currentValue;

    if (accType === 'Roth IRA') {
      rothTotal += value;
    } else if (accType === '401(k)' || accType === 'Traditional IRA') {
      tradIraOr401kTotal += value;
    } else {
      // Taxable, Personal, Other
      taxableTotal += value;
    }
  });

  const grandTotal = taxableTotal + rothTotal + tradIraOr401kTotal + cashTotal;

  return {
    taxableTotal,
    rothTotal,
    tradIraOr401kTotal,
    cashTotal,
    grandTotal,
  };
}

/**
 * Returns an updated FinancialInputs object with initial balances populated from the portfolio tracker.
 */
export function bridgePortfolioToPlanner(
  currentInputs: FinancialInputs,
  accounts: Account[],
  holdings: HoldingLot[],
  quotes: Record<string, MarketQuote>
): { updatedInputs: FinancialInputs; syncedAmounts: PortfolioBalanceBridge } {
  const bridge = computePortfolioBridgeBalances(accounts, holdings, quotes);

  const updatedInputs: FinancialInputs = {
    ...currentInputs,
    initGrowthInv: Math.round(bridge.taxableTotal),
    initRoth: Math.round(bridge.rothTotal),
    init401k: bridge.tradIraOr401kTotal > 0 ? Math.round(bridge.tradIraOr401kTotal) : currentInputs.init401k,
    // Preserve initial property and education unless specified
  };

  return { updatedInputs, syncedAmounts: bridge };
}
