import { HISTORICAL_MARKET_DATA } from './marketData';

export interface ExpenseCategories {
  housing: number;
  food: number;
  utilities: number;
  healthcare: number;
  travel: number;
  insurance: number;
  misc: number;
}

export type ReturnRateMode = 'constant' | 'historical_market';

export interface FinancialInputs {
  startAge: number;
  retirementAge: number;
  annualIncome: number;
  inflationRate: number;
  annualExpense: number;
  travelExpense: number;
  medicalInsurance: number;
  taxRateHigh: number;
  taxRateLow: number;
  companyMatchPct: number;
  pretax401kLimit: number;
  lifeInsurancePremium: number;
  rothContribution: number;
  
  // Initial Balances
  initCash: number;
  initGrowthInv: number;
  initBalanceInv: number;
  init401k: number;
  initRoth: number;
  initEdu: number;
  initProperty: number;

  // Growth Assumptions
  rateIncome: number;
  rateBalance: number;
  rateGrowth: number;

  // Market Return Mode Switch (Default vs. Historical MarketData)
  returnRateMode: ReturnRateMode;
  historicalStartYear: number;

  // Social Security
  enableSocialSecurity: boolean;
  ssAge: number;
  ssAnnualA: number;
  ssAnnualB: number;

  // 401(k) and Roth Switches
  enable401kMatch: boolean;
  enableRothConversion: boolean;
  rothConvAnnualAmount: number;
  rothConvAgeStart: number;
  rothConvAgeEnd: number;

  // Required Minimum Distributions (RMD @ 75)
  enableRmd: boolean;
  rmdStartAge: number;
  rmdRate: number;

  // Senior Expense Reduction Switch
  reduceExpensesAt75: boolean;

  // Granular Category Breakdown
  expenseCategories: ExpenseCategories;
}

export interface YearProjection {
  age: number;
  isRetired: boolean;
  appliedGrowthRate: number;
  appliedBalanceRate: number;
  appliedCashRate: number;
  ssA: number;
  ssB: number;
  earnedIncome: number;
  investmentIncome: number;
  totalIncome: number;
  effectiveTaxRate: number;
  incomeTax: number;
  contrib401k: number;
  companyMatch: number;
  rothContrib: number;
  otherExpenses: number;
  travelExpenses: number;
  medicalInsurance: number;
  lifeInsurancePremium: number;
  totalExpense: number;
  deficit: number; // positive = surplus, negative = deficit
  cash: number;
  growthInv: number;
  balanceInv: number;
  k401k: number;
  roth: number;
  edu: number;
  property: number;
  totalAssets: number;
}

export const DEFAULT_INPUTS: FinancialInputs = {
  startAge: 40,
  retirementAge: 61,
  annualIncome: 120000,
  inflationRate: 0.02,
  annualExpense: 60000,
  travelExpense: 5300,
  medicalInsurance: 4800,
  taxRateHigh: 0.25,
  taxRateLow: 0.05,
  companyMatchPct: 0.03,
  pretax401kLimit: 20500,
  lifeInsurancePremium: 10000,
  rothContribution: 6500,
  initCash: 100000,
  initGrowthInv: 100000,
  initBalanceInv: 100000,
  init401k: 250000,
  initRoth: 50000,
  initEdu: 0,
  initProperty: 0,
  rateIncome: 0.02,
  rateBalance: 0.04,
  rateGrowth: 0.07,
  returnRateMode: 'constant',
  historicalStartYear: 1974,
  enableSocialSecurity: true,
  ssAge: 67,
  ssAnnualA: 18000,
  ssAnnualB: 0,
  enable401kMatch: true,
  enableRothConversion: true,
  rothConvAnnualAmount: 10000,
  rothConvAgeStart: 60,
  rothConvAgeEnd: 70,
  enableRmd: true,
  rmdStartAge: 73,
  rmdRate: 0.15,
  reduceExpensesAt75: true,
  expenseCategories: {
    housing: 24000,
    food: 12000,
    utilities: 6000,
    healthcare: 4800,
    travel: 5300,
    insurance: 10000,
    misc: 18000,
  },
};

export function runFinanceProjection(inputs: FinancialInputs): YearProjection[] {
  const projection: YearProjection[] = [];

  let cash = inputs.initCash;
  let growthInv = inputs.initGrowthInv;
  let balanceInv = inputs.initBalanceInv;
  let roth = inputs.initRoth;
  let edu = inputs.initEdu;
  let property = inputs.initProperty;
  let k401k = inputs.init401k;

  const totalYears = 101 - inputs.startAge;

  for (let idx = 0; idx < totalYears; idx++) {
    const age = inputs.startAge + idx;
    const isRetired = age >= inputs.retirementAge;
    const isWorking = !isRetired;

    // Determine annual return rates based on returnRateMode switch
    let currentRateGrowth = inputs.rateGrowth;
    let currentRateBalance = inputs.rateBalance;
    let currentRateIncome = inputs.rateIncome;

    if (inputs.returnRateMode === 'historical_market') {
      const marketIdx = idx % HISTORICAL_MARKET_DATA.length;
      const mData = HISTORICAL_MARKET_DATA[marketIdx];
      currentRateGrowth = mData.growthFund;
      currentRateBalance = mData.balanceFund;
      currentRateIncome = mData.savingRate;
    }

    // --- 1. INCOME & EXPENSES ---
    let ssA = 0;
    let ssB = 0;

    if (inputs.enableSocialSecurity) {
      if (age === inputs.ssAge) {
        ssA = inputs.ssAnnualA;
        ssB = inputs.ssAnnualB;
      } else if (age > inputs.ssAge && idx > 0) {
        const prevSSA = projection[idx - 1].ssA;
        const prevSSB = projection[idx - 1].ssB;
        ssA = prevSSA * (1 + inputs.inflationRate);
        ssB = prevSSB * (1 + inputs.inflationRate);
      }
    }

    let earnedIncome = 0;
    if (idx === 0) {
      earnedIncome = inputs.annualIncome;
    } else if (isWorking) {
      earnedIncome = projection[idx - 1].earnedIncome * (1 + inputs.inflationRate);
    }

    const contrib401k = isWorking ? inputs.pretax401kLimit : 0;
    const companyMatch = isWorking && inputs.enable401kMatch ? earnedIncome * inputs.companyMatchPct : 0;
    const rothContrib = isWorking && earnedIncome > inputs.rothContribution ? inputs.rothContribution : 0;

    const isWithdrawing = age >= 65;
    const withdrawalRate = 0.04;
    const investmentIncome = isWithdrawing ? growthInv * withdrawalRate : 0;

    const totalIncome = ssA + ssB + earnedIncome + investmentIncome;

    // Progressive Tax Calculation
    const taxableBasis = Math.max(0, totalIncome - contrib401k);
    let effTaxRate = inputs.taxRateLow;
    if (taxableBasis >= 150000) {
      effTaxRate = inputs.taxRateHigh;
    } else if (taxableBasis >= 100000) {
      effTaxRate = inputs.taxRateLow + (inputs.taxRateHigh - inputs.taxRateLow) * 0.7;
    } else if (taxableBasis >= 50000) {
      effTaxRate = inputs.taxRateLow + (inputs.taxRateHigh - inputs.taxRateLow) * 0.5;
    }

    const incomeTax = taxableBasis * effTaxRate;

    // Expenses
    const travelExpenses = age < 75 || !inputs.reduceExpensesAt75 ? inputs.travelExpense : inputs.travelExpense * 0.5;
    const medicalInsurance = isWorking ? inputs.medicalInsurance : inputs.medicalInsurance * 1.5;
    
    let otherExpenses = inputs.annualExpense;
    if (age >= 75 && inputs.reduceExpensesAt75) {
      otherExpenses = inputs.annualExpense * 0.75;
    }
    if (idx > 0) {
      otherExpenses = projection[idx - 1].otherExpenses * (1 + inputs.inflationRate);
    }

    const totalExpense = incomeTax + travelExpenses + medicalInsurance + otherExpenses + inputs.lifeInsurancePremium;
    const deficit = totalIncome - totalExpense;

    // --- 2. ASSET GROWTH & DRAWDOWN HIERARCHY ---
    if (idx > 0) {
      const prevCash = projection[idx - 1].cash;
      const prevGrowth = projection[idx - 1].growthInv;
      const prevBalance = projection[idx - 1].balanceInv;
      const prev401k = projection[idx - 1].k401k;
      const prevRoth = projection[idx - 1].roth;
      const prevEdu = projection[idx - 1].edu;
      const prevProp = projection[idx - 1].property;

      const cashVal = prevCash * (1 + currentRateIncome);
      const growthVal = prevGrowth * (1 + currentRateGrowth);
      const balanceVal = prevBalance * (1 + currentRateBalance);

      const rmdWithdrawal = inputs.enableRmd && age >= inputs.rmdStartAge
        ? prev401k * (1 + currentRateGrowth) * inputs.rmdRate
        : 0;

      const rothConversion = inputs.enableRothConversion && age >= inputs.rothConvAgeStart && age <= inputs.rothConvAgeEnd
        ? inputs.rothConvAnnualAmount
        : 0;

      k401k = prev401k * (1 + currentRateGrowth) + contrib401k + companyMatch - rmdWithdrawal - rothConversion;
      roth = prevRoth * (1 + currentRateGrowth) + rothContrib + rothConversion;

      edu = prevEdu * 1.03;
      property = prevProp * 1.02;

      // Deficit Drawdown Hierarchy: Cash -> Growth Investment -> Balance Investment
      cash = cashVal + deficit;

      if (cash < 0) {
        growthInv = growthVal + cash; // cash is negative
        cash = 0;
        if (growthInv < 0) {
          balanceInv = balanceVal + growthInv; // growthInv is negative
          growthInv = 0;
          if (balanceInv < 0) {
            balanceInv = 0;
          }
        } else {
          balanceInv = balanceVal;
        }
      } else {
        growthInv = growthVal;
        balanceInv = balanceVal;
      }
    }

    const totalAssets = cash + growthInv + balanceInv + k401k + roth + edu + property;

    projection.push({
      age,
      isRetired,
      appliedGrowthRate: currentRateGrowth,
      appliedBalanceRate: currentRateBalance,
      appliedCashRate: currentRateIncome,
      ssA,
      ssB,
      earnedIncome,
      investmentIncome,
      totalIncome,
      effectiveTaxRate: effTaxRate,
      incomeTax,
      contrib401k,
      companyMatch,
      rothContrib,
      otherExpenses,
      travelExpenses,
      medicalInsurance,
      lifeInsurancePremium: inputs.lifeInsurancePremium,
      totalExpense,
      deficit,
      cash,
      growthInv,
      balanceInv,
      k401k,
      roth,
      edu,
      property,
      totalAssets,
    });
  }

  return projection;
}
