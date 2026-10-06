import { GridSimInputs, Account, HoldingLot, WatchlistStock } from '../types/investment';
import { DEFAULT_GRID_INPUTS } from '../engine/gridEngine';

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

  if (!Array.isArray(parsed.accounts) || !Array.isArray(parsed.holdings)) {
    throw new Error('Invalid portfolio backup file. Missing accounts or holdings arrays.');
  }

  return {
    $schema: parsed.$schema || 'investment-tracker-backup-v1',
    version: parsed.version || 1,
    exportedAt: parsed.exportedAt || new Date().toISOString(),
    user: typeof parsed.user === 'string' ? parsed.user : undefined,
    activeAccountId: typeof parsed.activeAccountId === 'string' ? parsed.activeAccountId : undefined,
    accounts: parsed.accounts,
    holdings: parsed.holdings,
    watchlist: Array.isArray(parsed.watchlist) ? parsed.watchlist : [],
    gridInputs: parsed.gridInputs && typeof parsed.gridInputs === 'object' ? parsed.gridInputs : DEFAULT_GRID_INPUTS,
  };
}
