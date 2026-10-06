import { FinancialInputs, DEFAULT_INPUTS } from '../engine/financeEngine';

export interface PresetFileSchema {
  $schema?: string;
  version: number;
  name?: string;
  exportedAt: string;
  inputs: FinancialInputs;
}

/**
 * Serializes current planner settings into a downloadable JSON preset file.
 */
export function exportPresetToFile(inputs: FinancialInputs, scenarioName: string = 'Custom Scenario'): void {
  const safeName = scenarioName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'financial_scenario';
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `preset_${safeName}_${timestamp}.json`;

  const payload: PresetFileSchema = {
    $schema: 'personal-finance-planner-preset-v1',
    version: 1,
    name: scenarioName.trim() || 'Custom Scenario',
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
 * Reads, validates, and parses an uploaded JSON preset file.
 * Automatically merges missing or legacy fields with DEFAULT_INPUTS for full backward compatibility.
 */
export async function parseAndValidatePresetFile(file: File): Promise<{ inputs: FinancialInputs; name: string }> {
  const content = await file.text();
  let parsed: any;

  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error('Invalid JSON file format. Please upload a valid .json preset file.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Corrupted preset file structure.');
  }

  // Handle both { inputs: { ... }, name: ... } and direct inputs payload
  const rawInputs = parsed.inputs && typeof parsed.inputs === 'object' ? parsed.inputs : parsed;
  const scenarioName = typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : file.name.replace(/\.[^/.]+$/, '');

  // Merge expense categories safely
  const mergedExpenses = {
    ...DEFAULT_INPUTS.expenseCategories,
    ...(rawInputs.expenseCategories && typeof rawInputs.expenseCategories === 'object' ? rawInputs.expenseCategories : {}),
  };

  // Merge all inputs with DEFAULT_INPUTS to protect against future schema evolution
  const merged: FinancialInputs = {
    ...DEFAULT_INPUTS,
    ...rawInputs,
    expenseCategories: mergedExpenses,
  };

  // Data sanitization and range enforcement
  merged.startAge = Math.min(85, Math.max(18, Number(merged.startAge) || DEFAULT_INPUTS.startAge));
  merged.retirementAge = Math.min(95, Math.max(merged.startAge + 1, Number(merged.retirementAge) || DEFAULT_INPUTS.retirementAge));

  if (merged.historicalStartYear !== undefined && merged.historicalEndYear !== undefined) {
    if (merged.historicalStartYear > merged.historicalEndYear) {
      const temp = merged.historicalStartYear;
      merged.historicalStartYear = merged.historicalEndYear;
      merged.historicalEndYear = temp;
    }
  }

  if (merged.rothConvAgeStart !== undefined && merged.rothConvAgeEnd !== undefined) {
    if (merged.rothConvAgeStart > merged.rothConvAgeEnd) {
      merged.rothConvAgeEnd = merged.rothConvAgeStart;
    }
  }

  return {
    inputs: merged,
    name: scenarioName,
  };
}
