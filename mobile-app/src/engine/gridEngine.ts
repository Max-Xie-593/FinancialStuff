import { GridSimInputs, GridSimSummary, GridSimTier } from '../types/investment';

export const DEFAULT_GRID_INPUTS: GridSimInputs = {
  stepCash: 10000,
  high52wk: 318.82,
  startBuyPct: 0.674, // 67.4%
  buyStepPct: 0.1,    // 10%
  sellPct: 0.7,       // 70%
  cycleYears: 7,
  numTiers: 7,
};

/**
 * Executes the systematic Grid Buying Scenario Simulator.
 * Mathematical equivalent of the Excel ReturnEstimation sheet and invest_logic.py.
 */
export function runGridSimulation(inputs: GridSimInputs): GridSimSummary {
  const {
    stepCash,
    high52wk,
    startBuyPct,
    buyStepPct,
    sellPct,
    cycleYears,
    numTiers,
  } = inputs;

  const tiers: GridSimTier[] = [];
  let totalCostBasis = 0;
  let totalProceeds = 0;
  let totalGainLoss = 0;

  let currentBuyPct = startBuyPct;

  for (let i = 0; i < numTiers; i++) {
    if (currentBuyPct <= 0) break;

    const buyPrice = high52wk * currentBuyPct;
    const sharesBought = buyPrice > 0.001 ? stepCash / buyPrice : 0;
    const costBasis = buyPrice * sharesBought; // identical to stepCash
    const sellPrice = sellPct * high52wk;
    const yearsHeld = cycleYears * currentBuyPct * sellPct;
    const proceeds = sharesBought * sellPrice;
    const gainLoss = proceeds - costBasis;
    const gainLossPercent = costBasis > 0.01 ? (gainLoss / costBasis) : 0;

    tiers.push({
      tier: i + 1,
      cashInvested: stepCash,
      buyPctOfHigh: currentBuyPct,
      buyPrice,
      sharesBought,
      sellPrice,
      yearsHeld,
      proceeds,
      gainLoss,
      gainLossPercent,
    });

    totalCostBasis += costBasis;
    totalProceeds += proceeds;
    totalGainLoss += gainLoss;

    currentBuyPct = Math.max(0, currentBuyPct - buyStepPct);
  }

  return {
    totalCashInvested: totalCostBasis,
    totalProceeds,
    totalGainLoss,
    totalGainLossPercent: totalCostBasis > 0.01 ? totalGainLoss / totalCostBasis : 0,
    tiers,
  };
}
