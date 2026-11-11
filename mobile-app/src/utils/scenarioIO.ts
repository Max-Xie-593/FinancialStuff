import { GridSimInputs, Account, HoldingLot, WatchlistStock } from '../types/investment';
import { DEFAULT_GRID_INPUTS } from '../engine/gridEngine';
import { FinancialInputs, DEFAULT_INPUTS } from '../engine/financeEngine';
import { exportPresetToFile } from './presetIO';

export interface GridScenarioFileSchema {
  $schema: string;
  version: number;
  name: string;
  exportedAt: string;
  inputs: GridSimInputs;
}

export interface PortfolioBackupSchema {
  $schema: string;
  version: number;
  exportedAt: string;
  user?: string;
  activeAccountId?: string;
  accounts: Account[];
  holdings: HoldingLot[];
  watchlist: WatchlistStock[];
  gridInputs: GridSimInputs;
}

/**
 * Serializes current Return Estimation Grid Simulator settings into a downloadable JSON file.
 */
export function exportGridScenarioToFile(inputs: GridSimInputs, scenarioName: string = 'Grid Strategy'): void {
  const safeName = scenarioName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'grid_scenario';
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `grid_scenario_${safeName}_${timestamp}.json`;

  const payload: GridScenarioFileSchema = {
    $schema: 'investment-tracker-grid-v1',
    version: 1,
    name: scenarioName.trim() || 'Custom Grid Strategy',
    exportedAt: new Date().toISOString(),
    inputs,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Reads, validates, and parses an uploaded JSON grid scenario file.
 */
export async function parseAndValidateGridScenarioFile(file: File): Promise<{ inputs: GridSimInputs; name: string }> {
  const content = await file.text();
  let parsed: any;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON file format. Please upload a valid .json scenario file.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Corrupted scenario file structure.');
  }

  const rawInputs = parsed.inputs && typeof parsed.inputs === 'object' ? parsed.inputs : parsed;
  const scenarioName = typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : file.name.replace(/\.[^/.]+$/, '');

  const merged: GridSimInputs = {
    stepCash: Math.max(100, Number(rawInputs.stepCash) || DEFAULT_GRID_INPUTS.stepCash),
    high52wk: Math.max(0.01, Number(rawInputs.high52wk) || DEFAULT_GRID_INPUTS.high52wk),
    startBuyPct: Math.min(1.5, Math.max(0.05, Number(rawInputs.startBuyPct) || DEFAULT_GRID_INPUTS.startBuyPct)),
    buyStepPct: Math.min(0.5, Math.max(0.01, Number(rawInputs.buyStepPct) || DEFAULT_GRID_INPUTS.buyStepPct)),
    sellPct: Math.min(3.0, Math.max(0.1, Number(rawInputs.sellPct) || DEFAULT_GRID_INPUTS.sellPct)),
    cycleYears: Math.min(30, Math.max(1, Number(rawInputs.cycleYears) || DEFAULT_GRID_INPUTS.cycleYears)),
    numTiers: Math.min(20, Math.max(1, Math.round(Number(rawInputs.numTiers) || DEFAULT_GRID_INPUTS.numTiers))),
  };

  return {
    inputs: merged,
    name: scenarioName,
  };
}

/**
 * Exports complete portfolio, accounts, watchlist, and grid settings to a backup JSON file.
 */
export function exportFullPortfolioBackup(data: {
  accounts: Account[];
  holdings: HoldingLot[];
  watchlist: WatchlistStock[];
  gridInputs: GridSimInputs;
  activeAccountId?: string;
  user?: string;
  exportedAt?: string;
}): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `portfolio_backup_${timestamp}.json`;

  const payload: PortfolioBackupSchema = {
    $schema: 'investment-tracker-backup-v1',
    version: 1,
    exportedAt: data.exportedAt || new Date().toISOString(),
    user: data.user,
    activeAccountId: data.activeAccountId,
    accounts: data.accounts,
    holdings: data.holdings,
    watchlist: data.watchlist,
    gridInputs: data.gridInputs,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates and restores complete portfolio backup.
 */
export async function parseAndValidatePortfolioBackup(file: File): Promise<PortfolioBackupSchema> {
  const content = await file.text();
  let parsed: any;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON file format. Please upload a valid .json portfolio backup.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Corrupted portfolio backup file.');
  }

  // Support root wrapper objects like { data: ... } or { portfolio: ... }
  const root = parsed.data || parsed.portfolio || parsed;

  let rawAccounts = root.accounts;
  let rawHoldings = root.holdings || root.positions || (Array.isArray(root) ? root : null);

  // If rawHoldings is valid array but accounts is missing, generate fallback accounts
  if (Array.isArray(rawHoldings) && (!Array.isArray(rawAccounts) || rawAccounts.length === 0)) {
    const detectedAccountIds = new Set<string>();
    rawHoldings.forEach((h: any) => {
      if (h.accountId) detectedAccountIds.add(h.accountId);
    });

    if (detectedAccountIds.size > 0) {
      rawAccounts = Array.from(detectedAccountIds).map((accId) => ({
        id: accId,
        name: accId === 'acc-taxable-1' ? 'Taxable Brokerage' : accId === 'acc-roth-1' ? 'Roth IRA' : accId,
        type: accId.toLowerCase().includes('roth') ? 'Roth IRA' : 'Taxable',
      }));
    } else {
      rawAccounts = [
        { id: 'acc-taxable-1', name: 'Taxable Brokerage', type: 'Taxable' },
        { id: 'acc-roth-1', name: 'Roth IRA', type: 'Roth IRA' },
      ];
    }
  }

  if (!Array.isArray(rawAccounts) || !Array.isArray(rawHoldings)) {
    throw new Error('Invalid portfolio backup file. Missing accounts or holdings arrays.');
  }

  return {
    $schema: root.$schema || 'investment-tracker-backup-v1',
    version: root.version || 1,
    exportedAt: root.exportedAt || new Date().toISOString(),
    user: typeof root.user === 'string' ? root.user : undefined,
    activeAccountId: typeof root.activeAccountId === 'string' ? root.activeAccountId : undefined,
    accounts: rawAccounts,
    holdings: rawHoldings,
    watchlist: Array.isArray(root.watchlist) ? root.watchlist : [],
    gridInputs: root.gridInputs && typeof root.gridInputs === 'object' ? root.gridInputs : DEFAULT_GRID_INPUTS,
  };
}

export interface FullSuiteBackupSchema {
  $schema: string;
  version: number;
  exportedAt: string;
  user?: string;
  plannerInputs: FinancialInputs;
  portfolio: {
    accounts: Account[];
    holdings: HoldingLot[];
    watchlist: WatchlistStock[];
    gridInputs: GridSimInputs;
    activeAccountId?: string;
  };
}

/**
 * Exports complete Financial Suite master backup (both Wealth Planner inputs & Portfolio assets).
 */
export function exportFullSuiteBackup(data: {
  plannerInputs: FinancialInputs;
  accounts: Account[];
  holdings: HoldingLot[];
  watchlist: WatchlistStock[];
  gridInputs: GridSimInputs;
  activeAccountId?: string;
  user?: string;
}): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `financial_suite_master_backup_${timestamp}.json`;

  const payload: FullSuiteBackupSchema = {
    $schema: 'financial-suite-full-backup-v1',
    version: 1,
    exportedAt: new Date().toISOString(),
    user: data.user,
    plannerInputs: data.plannerInputs,
    portfolio: {
      accounts: data.accounts,
      holdings: data.holdings,
      watchlist: data.watchlist,
      gridInputs: data.gridInputs,
      activeAccountId: data.activeAccountId,
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface UniversalRestoreResult {
  kind: 'full_suite' | 'portfolio' | 'planner';
  summary: string;
  plannerInputs?: FinancialInputs;
  portfolio?: PortfolioBackupSchema;
}

/**
 * Universal Backup Importer
 * Automatically detects whether an uploaded JSON file is:
 * 1) A Full Suite Master Backup (Planner + Portfolio)
 * 2) An Investment Tracker Portfolio Backup (accounts, holdings, watchlist)
 * 3) A Wealth Planner Scenario Preset (startAge, annualIncome, tax rates, expenses)
 */
export async function parseAndValidateAnyBackup(file: File): Promise<UniversalRestoreResult> {
  const content = await file.text();
  let parsed: any;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON format. Please upload a valid .json backup file.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Corrupted JSON file structure.');
  }

  // 1. Full Suite Master Backup
  if (
    parsed.$schema === 'financial-suite-full-backup-v1' ||
    (parsed.plannerInputs && (parsed.portfolio || parsed.accounts))
  ) {
    const planner = parsed.plannerInputs;
    const port = parsed.portfolio || parsed;
    const holdingsCount = port.holdings?.length || 0;
    const accountsCount = port.accounts?.length || 0;

    return {
      kind: 'full_suite',
      summary: `Restored Complete Financial Suite (${holdingsCount} holdings, ${accountsCount} accounts, and all Wealth Planner parameters)!`,
      plannerInputs: {
        ...DEFAULT_INPUTS,
        ...planner,
        expenseCategories: {
          ...DEFAULT_INPUTS.expenseCategories,
          ...(planner.expenseCategories || {}),
        },
      },
      portfolio: {
        $schema: 'investment-tracker-backup-v1',
        version: 1,
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        user: parsed.user,
        activeAccountId: port.activeAccountId,
        accounts: port.accounts || [],
        holdings: port.holdings || [],
        watchlist: port.watchlist || [],
        gridInputs: port.gridInputs || DEFAULT_GRID_INPUTS,
      },
    };
  }

  // 2. Wealth Planner Preset
  if (
    parsed.$schema === 'personal-finance-planner-preset-v1' ||
    (parsed.inputs && (parsed.inputs.startAge !== undefined || parsed.inputs.annualIncome !== undefined)) ||
    (parsed.startAge !== undefined && parsed.annualIncome !== undefined)
  ) {
    const rawInputs = parsed.inputs || parsed;
    const name = parsed.name || file.name.replace(/\.[^/.]+$/, '');
    return {
      kind: 'planner',
      summary: `Restored Wealth Planner Scenario "${name}"!`,
      plannerInputs: {
        ...DEFAULT_INPUTS,
        ...rawInputs,
        expenseCategories: {
          ...DEFAULT_INPUTS.expenseCategories,
          ...(rawInputs.expenseCategories || {}),
        },
      },
    };
  }

  // 3. Portfolio Backup
  try {
    const portfolioData = await parseAndValidatePortfolioBackup(file);
    return {
      kind: 'portfolio',
      summary: `Restored Portfolio (${portfolioData.holdings.length} holdings across ${portfolioData.accounts.length} accounts)!`,
      portfolio: portfolioData,
    };
  } catch (err: any) {
    throw new Error('Unrecognized backup format. The uploaded file does not match a Portfolio, Wealth Planner, or Suite backup.');
  }
}
