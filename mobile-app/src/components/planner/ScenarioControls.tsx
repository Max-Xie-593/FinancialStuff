import React, { useState, useRef } from 'react';
import { FinancialInputs, DEFAULT_INPUTS } from '../../engine/financeEngine';
import { exportPresetToFile, parseAndValidatePresetFile } from '../../utils/presetIO';
import {
  Sliders,
  DollarSign,
  Percent,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Building,
  Receipt,
  Landmark,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface Props {
  inputs: FinancialInputs;
  onChange: (updated: FinancialInputs) => void;
  onReset: () => void;
}

export const ScenarioControls: React.FC<Props> = ({ inputs, onChange, onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [openSection, setOpenSection] = useState<{
    balances: boolean;
    rates: boolean;
    taxes: boolean;
    retirementVehicles: boolean;
    socialSecurity: boolean;
    advanced: boolean;
  }>({
    balances: false,
    rates: false,
    taxes: false,
    retirementVehicles: false,
    socialSecurity: false,
    advanced: false,
  });

  const toggleSection = (section: keyof typeof openSection) => {
    setOpenSection((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChange = (key: keyof FinancialInputs, value: any) => {
    const updated = {
      ...inputs,
      [key]: value,
    };

    // If startAge changed and retirementAge is now less than startAge, adjust retirementAge
    if (key === 'startAge' && updated.retirementAge <= value) {
      updated.retirementAge = Math.min(80, value + 1);
    }

    // Ensure historicalStartYear does not exceed historicalEndYear
    if (key === 'historicalStartYear' && updated.historicalEndYear < value) {
      updated.historicalEndYear = value;
    }

    // Ensure historicalEndYear is not less than historicalStartYear
    if (key === 'historicalEndYear' && updated.historicalStartYear > value) {
      updated.historicalStartYear = value;
    }

    // Ensure rothConvAgeStart does not exceed rothConvAgeEnd
    if (key === 'rothConvAgeStart' && updated.rothConvAgeEnd < value) {
      updated.rothConvAgeEnd = value;
    }

    // Ensure rothConvAgeEnd is not less than rothConvAgeStart
    if (key === 'rothConvAgeEnd' && updated.rothConvAgeStart > value) {
      updated.rothConvAgeStart = value;
    }

    onChange(updated);
  };

  const handleMultipleChanges = (updates: Partial<FinancialInputs>) => {
    const updated = {
      ...inputs,
      ...updates,
    };

    if (
      updated.historicalStartYear !== undefined &&
      updated.historicalEndYear !== undefined &&
      updated.historicalStartYear > updated.historicalEndYear
    ) {
      updated.historicalEndYear = updated.historicalStartYear;
    }

    if (
      updated.rothConvAgeStart !== undefined &&
      updated.rothConvAgeEnd !== undefined &&
      updated.rothConvAgeStart > updated.rothConvAgeEnd
    ) {
      updated.rothConvAgeEnd = updated.rothConvAgeStart;
    }

    onChange(updated);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  // Scenario Presets
  const applyPreset = (presetName: string) => {
    if (presetName === 'default') {
      onChange(DEFAULT_INPUTS);
    } else if (presetName === 'fire') {
      onChange({
        ...DEFAULT_INPUTS,
        startAge: 30,
        retirementAge: 48,
        annualIncome: 160000,
        annualExpense: 48000,
        rateGrowth: 0.08,
        pretax401kLimit: 23000,
        rothContribution: 7000,
      });
    } else if (presetName === 'conservative') {
      onChange({
        ...DEFAULT_INPUTS,
        startAge: 40,
        retirementAge: 65,
        rateGrowth: 0.05,
        rateBalance: 0.03,
        rateIncome: 0.015,
        inflationRate: 0.03,
      });
    } else if (presetName === 'inflation_shock') {
      onChange({
        ...DEFAULT_INPUTS,
        inflationRate: 0.045,
        rateGrowth: 0.06,
        rateBalance: 0.035,
      });
    }
  };

  const handleExport = () => {
    exportPresetToFile(inputs, `scenario_age_${inputs.startAge}`);
    setToastMessage({ text: 'Preset file saved and downloaded!', type: 'success' });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { inputs: loadedInputs, name } = await parseAndValidatePresetFile(file);
      onChange(loadedInputs);
      setToastMessage({ text: `Loaded preset "${name}"!`, type: 'success' });
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Failed to read preset file.', type: 'error' });
      setTimeout(() => setToastMessage(null), 4500);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="glass-panel controls-card">
      <div className="section-title">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="#3b82f6" /> Scenario Parameters
        </span>
        <button
          onClick={onReset}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '12px',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Reset All
        </button>
      </div>

      {/* Preset Selector */}
      <div className="scenario-presets-card">
        <div className="presets-header">
          <Sparkles size={14} color="var(--accent-warning)" />
          <span>Load Scenario Preset:</span>
        </div>
        <div className="preset-grid">
          <button
            type="button"
            onClick={() => applyPreset('default')}
            className="preset-chip-btn"
          >
            Standard Excel
          </button>
          <button
            type="button"
            onClick={() => applyPreset('fire')}
            className="preset-chip-btn chip-fire"
          >
            FIRE @ 48
          </button>
          <button
            type="button"
            onClick={() => applyPreset('conservative')}
            className="preset-chip-btn chip-conservative"
          >
            Conservative
          </button>
          <button
            type="button"
            onClick={() => applyPreset('inflation_shock')}
            className="preset-chip-btn chip-inflation"
          >
            Inflation 4.5%
          </button>
        </div>

        {/* File Export / Import Actions */}
        <div className="preset-actions-row">
          <button
            type="button"
            onClick={handleExport}
            className="preset-io-btn export"
            title="Save all current settings into a downloadable .json preset file"
          >
            <Download size={13} /> Save to File
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="preset-io-btn import"
            title="Upload and load a saved .json preset file"
          >
            <Upload size={13} /> Upload File
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json,application/json"
          style={{ display: 'none' }}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              marginTop: '8px',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
              color: toastMessage.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
              border: `1px solid ${toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            }}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 size={13} style={{ flexShrink: 0 }} /> : <AlertCircle size={13} style={{ flexShrink: 0 }} />}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{toastMessage.text}</span>
          </div>
        )}
      </div>

      {/* 1. CORE MILESTONES */}
      <div style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '12px' }}>
        <div className="section-title" style={{ fontSize: '13px', marginBottom: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCheck size={15} color="var(--accent-cyan)" /> Core Milestones
          </span>
        </div>

        {/* Starting Age */}
        <div className="input-group">
          <div className="input-header">
            <span>Starting Age</span>
            <span className="input-value">{inputs.startAge} yrs</span>
          </div>
          <input
            type="range"
            min={18}
            max={75}
            step={1}
            value={inputs.startAge}
            onChange={(e) => handleChange('startAge', Number(e.target.value))}
          />
        </div>

        {/* Target Retirement Age */}
        <div className="input-group">
          <div className="input-header">
            <span>Target Retirement Age</span>
            <span className="input-value">{inputs.retirementAge} yrs</span>
          </div>
          <input
            type="range"
            min={Math.max(inputs.startAge + 1, 30)}
            max={85}
            step={1}
            value={inputs.retirementAge}
            onChange={(e) => handleChange('retirementAge', Number(e.target.value))}
          />
        </div>

        {/* Annual Income */}
        <div className="input-group">
          <div className="input-header">
            <span>Annual Gross Starting Income</span>
            <span className="input-value">{formatCurrency(inputs.annualIncome)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={500000}
            step={2500}
            value={inputs.annualIncome}
            onChange={(e) => handleChange('annualIncome', Number(e.target.value))}
          />
        </div>

        {/* Annual Living Expense */}
        <div className="input-group">
          <div className="input-header">
            <span>Annual Living Expense</span>
            <span className="input-value">{formatCurrency(inputs.annualExpense)}</span>
          </div>
          <input
            type="range"
            min={10000}
            max={300000}
            step={2500}
            value={inputs.annualExpense}
            onChange={(e) => handleChange('annualExpense', Number(e.target.value))}
          />
        </div>
      </div>

      {/* 2. STARTING ASSET BALANCES (COLLAPSIBLE) */}
      <div style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '12px' }}>
        <button
          onClick={() => toggleSection('balances')}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={15} color="#10b981" /> Starting Balances (Age {inputs.startAge})
          </span>
          {openSection.balances ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {openSection.balances && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <div className="input-group">
              <div className="input-header">
                <span>Cash Savings</span>
                <span className="input-value">{formatCurrency(inputs.initCash)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={2000000}
                step={10000}
                value={inputs.initCash}
                onChange={(e) => handleChange('initCash', Number(e.target.value))}
              />
            </div>

            <div className="input-group">
              <div className="input-header">
                <span>401(k) / Traditional IRA</span>
                <span className="input-value">{formatCurrency(inputs.init401k)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={2000000}
                step={25000}
                value={inputs.init401k}
                onChange={(e) => handleChange('init401k', Number(e.target.value))}
              />
            </div>

            <div className="input-group">
              <div className="input-header">
                <span>Roth IRA Balance</span>
                <span className="input-value">{formatCurrency(inputs.initRoth)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={2000000}
                step={10000}
                value={inputs.initRoth}
                onChange={(e) => handleChange('initRoth', Number(e.target.value))}
              />
            </div>

            <div className="input-group">
              <div className="input-header">
                <span>Taxable Growth Investments</span>
                <span className="input-value">{formatCurrency(inputs.initGrowthInv)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={2000000}
                step={10000}
                value={inputs.initGrowthInv}
                onChange={(e) => handleChange('initGrowthInv', Number(e.target.value))}
              />
            </div>

            <div className="input-group">
              <div className="input-header">
                <span>Balanced Fund Investments</span>
                <span className="input-value">{formatCurrency(inputs.initBalanceInv)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={2000000}
                step={10000}
                value={inputs.initBalanceInv}
                onChange={(e) => handleChange('initBalanceInv', Number(e.target.value))}
              />
            </div>

            <div className="input-group">
              <div className="input-header">
                <span>Education Funds (529)</span>
                <span className="input-value">{formatCurrency(inputs.initEdu)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={250000}
                step={5000}
                value={inputs.initEdu}
                onChange={(e) => handleChange('initEdu', Number(e.target.value))}
              />
            </div>

            <div className="input-group">
              <div className="input-header">
                <span>Property / Real Estate Equity</span>
                <span className="input-value">{formatCurrency(inputs.initProperty)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={2000000}
                step={25000}
                value={inputs.initProperty}
                onChange={(e) => handleChange('initProperty', Number(e.target.value))}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. GROWTH & INFLATION RATES (COLLAPSIBLE) */}
      <div style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '12px' }}>
        <button
          onClick={() => toggleSection('rates')}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Percent size={15} color="#8b5cf6" /> Growth & Inflation Rates
          </span>
          {openSection.rates ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {openSection.rates && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            {/* Return Rate Mode Switch */}
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Return Rate Mode (Spreadsheet Switch)
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                <button
                  type="button"
                  className={`tab-btn ${inputs.returnRateMode === 'constant' ? 'active' : ''}`}
                  onClick={() => handleChange('returnRateMode', 'constant')}
                  style={{ fontSize: '11px', padding: '6px', justifyContent: 'center' }}
                >
                  Constant Assumed %
                </button>
                <button
                  type="button"
                  className={`tab-btn ${inputs.returnRateMode === 'historical_market' ? 'active' : ''}`}
                  onClick={() => handleChange('returnRateMode', 'historical_market')}
                  style={{ fontSize: '11px', padding: '6px', justifyContent: 'center' }}
                >
                  Historical MarketData
                </button>
              </div>
            </div>

            {inputs.returnRateMode === 'historical_market' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--accent-cyan)', display: 'block', marginBottom: '2px' }}>
                    🔄 Cycling {Math.abs((inputs.historicalEndYear || 2024) - (inputs.historicalStartYear || 1974)) + 1}-Year Market Window
                  </strong>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Replaying <strong>{Math.min(inputs.historicalStartYear || 1974, inputs.historicalEndYear || 2024)} – {Math.max(inputs.historicalStartYear || 1974, inputs.historicalEndYear || 2024)}</strong> repeatedly on a loop across your lifetime projection.
                  </p>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Historical Regime Presets:
                  </span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="tab-btn"
                      onClick={() => {
                        handleMultipleChanges({
                          historicalStartYear: 1974,
                          historicalEndYear: 2024,
                        });
                      }}
                      style={{ fontSize: '10px', padding: '4px 8px', background: inputs.historicalStartYear === 1974 && inputs.historicalEndYear === 2024 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)' }}
                    >
                      Full 1974–2024
                    </button>
                    <button
                      type="button"
                      className="tab-btn"
                      onClick={() => {
                        handleMultipleChanges({
                          historicalStartYear: 2000,
                          historicalEndYear: 2010,
                        });
                      }}
                      style={{ fontSize: '10px', padding: '4px 8px', background: inputs.historicalStartYear === 2000 && inputs.historicalEndYear === 2010 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)' }}
                    >
                      Lost Decade (2000–10)
                    </button>
                    <button
                      type="button"
                      className="tab-btn"
                      onClick={() => {
                        handleMultipleChanges({
                          historicalStartYear: 2009,
                          historicalEndYear: 2021,
                        });
                      }}
                      style={{ fontSize: '10px', padding: '4px 8px', background: inputs.historicalStartYear === 2009 && inputs.historicalEndYear === 2021 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)' }}
                    >
                      Bull Run (2009–21)
                    </button>
                    <button
                      type="button"
                      className="tab-btn"
                      onClick={() => {
                        handleMultipleChanges({
                          historicalStartYear: 1974,
                          historicalEndYear: 1982,
                        });
                      }}
                      style={{ fontSize: '10px', padding: '4px 8px', background: inputs.historicalStartYear === 1974 && inputs.historicalEndYear === 1982 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)' }}
                    >
                      Stagflation (1974–82)
                    </button>
                    <button
                      type="button"
                      className="tab-btn"
                      onClick={() => {
                        handleMultipleChanges({
                          historicalStartYear: 2020,
                          historicalEndYear: 2024,
                        });
                      }}
                      style={{ fontSize: '10px', padding: '4px 8px', background: inputs.historicalStartYear === 2020 && inputs.historicalEndYear === 2024 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)' }}
                    >
                      2020–24 Volatility
                    </button>
                  </div>
                </div>

                {/* Custom Start / End Year Sliders */}
                <div className="input-group">
                  <div className="input-header">
                    <span>Cycle Start Year</span>
                    <span className="input-value">{inputs.historicalStartYear || 1974}</span>
                  </div>
                  <input
                    type="range"
                    min={1974}
                    max={inputs.historicalEndYear || 2024}
                    step={1}
                    value={inputs.historicalStartYear || 1974}
                    onChange={(e) => handleChange('historicalStartYear', Number(e.target.value))}
                  />
                </div>

                <div className="input-group">
                  <div className="input-header">
                    <span>Cycle End Year</span>
                    <span className="input-value">{inputs.historicalEndYear || 2024}</span>
                  </div>
                  <input
                    type="range"
                    min={inputs.historicalStartYear || 1974}
                    max={2024}
                    step={1}
                    value={inputs.historicalEndYear || 2024}
                    onChange={(e) => handleChange('historicalEndYear', Number(e.target.value))}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="input-group">
                  <div className="input-header">
                    <span>Growth Investments ROI</span>
                    <span className="input-value">{(inputs.rateGrowth * 100).toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.02}
                    max={0.15}
                    step={0.005}
                    value={inputs.rateGrowth}
                    onChange={(e) => handleChange('rateGrowth', Number(e.target.value))}
                  />
                </div>

                <div className="input-group">
                  <div className="input-header">
                    <span>Balanced Investments ROI</span>
                    <span className="input-value">{(inputs.rateBalance * 100).toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.01}
                    max={0.10}
                    step={0.005}
                    value={inputs.rateBalance}
                    onChange={(e) => handleChange('rateBalance', Number(e.target.value))}
                  />
                </div>

                <div className="input-group">
                  <div className="input-header">
                    <span>Cash Savings Yield</span>
                    <span className="input-value">{(inputs.rateIncome * 100).toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={0.07}
                    step={0.005}
                    value={inputs.rateIncome}
                    onChange={(e) => handleChange('rateIncome', Number(e.target.value))}
                  />
                </div>
              </>
            )}

            <div className="input-group">
              <div className="input-header">
                <span>Annual Inflation Rate</span>
                <span className="input-value">{(inputs.inflationRate * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min={0.01}
                max={0.08}
                step={0.005}
                value={inputs.inflationRate}
                onChange={(e) => handleChange('inflationRate', Number(e.target.value))}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. TAX BRACKETS (COLLAPSIBLE) */}
      <div style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '12px' }}>
        <button
          onClick={() => toggleSection('taxes')}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Receipt size={15} color="var(--accent-warning)" /> Progressive Tax Rates
          </span>
          {openSection.taxes ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {openSection.taxes && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <div className="input-group">
              <div className="input-header">
                <span>Top Bracket Rate (High Tier)</span>
                <span className="input-value">{(inputs.taxRateHigh * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.15}
                max={0.45}
                step={0.01}
                value={inputs.taxRateHigh}
                onChange={(e) => handleChange('taxRateHigh', Number(e.target.value))}
              />
            </div>

            <div className="input-group">
              <div className="input-header">
                <span>Base Bracket Rate (Low Tier)</span>
                <span className="input-value">{(inputs.taxRateLow * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.0}
                max={0.15}
                step={0.01}
                value={inputs.taxRateLow}
                onChange={(e) => handleChange('taxRateLow', Number(e.target.value))}
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. RETIREMENT VEHICLES & 401K/ROTH (COLLAPSIBLE) */}
      <div style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '12px' }}>
        <button
          onClick={() => toggleSection('retirementVehicles')}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building size={15} color="var(--accent-purple)" /> 401(k) & Roth Strategies
          </span>
          {openSection.retirementVehicles ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {openSection.retirementVehicles && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {/* 401k Limit */}
            <div className="input-group">
              <div className="input-header">
                <span>401(k) Pre-Tax Annual Limit</span>
                <span className="input-value">{formatCurrency(inputs.pretax401kLimit)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={35000}
                step={500}
                value={inputs.pretax401kLimit}
                onChange={(e) => handleChange('pretax401kLimit', Number(e.target.value))}
              />
            </div>

            {/* 401k Match Toggle & % */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>401(k) Employer Match</span>
              <button
                onClick={() => handleChange('enable401kMatch', !inputs.enable401kMatch)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: inputs.enable401kMatch ? 'var(--accent-primary)' : 'var(--text-dim)' }}
              >
                {inputs.enable401kMatch ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
              </button>
            </div>

            {inputs.enable401kMatch && (
              <div className="input-group" style={{ paddingLeft: '8px', borderLeft: '2px solid var(--accent-primary)' }}>
                <div className="input-header">
                  <span>Employer Match %</span>
                  <span className="input-value">{(inputs.companyMatchPct * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min={0.01}
                  max={0.10}
                  step={0.005}
                  value={inputs.companyMatchPct}
                  onChange={(e) => handleChange('companyMatchPct', Number(e.target.value))}
                />
              </div>
            )}

            {/* Roth Contribution */}
            <div className="input-group">
              <div className="input-header">
                <span>Roth IRA Annual Contribution</span>
                <span className="input-value">{formatCurrency(inputs.rothContribution)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={15000}
                step={500}
                value={inputs.rothContribution}
                onChange={(e) => handleChange('rothContribution', Number(e.target.value))}
              />
            </div>

            {/* Roth Conversion Window */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Roth Conversion Window</span>
              <button
                onClick={() => handleChange('enableRothConversion', !inputs.enableRothConversion)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: inputs.enableRothConversion ? 'var(--accent-purple)' : 'var(--text-dim)' }}
              >
                {inputs.enableRothConversion ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
              </button>
            </div>

            {inputs.enableRothConversion && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px', borderLeft: '2px solid var(--accent-purple)' }}>
                <div className="input-group">
                  <div className="input-header">
                    <span>Annual Conversion Amount</span>
                    <span className="input-value">{formatCurrency(inputs.rothConvAnnualAmount)}/yr</span>
                  </div>
                  <input
                    type="range"
                    min={2000}
                    max={150000}
                    step={1000}
                    value={inputs.rothConvAnnualAmount}
                    onChange={(e) => handleChange('rothConvAnnualAmount', Number(e.target.value))}
                  />
                </div>

                <div className="input-group">
                  <div className="input-header">
                    <span>Conversion Start Age</span>
                    <span className="input-value">{inputs.rothConvAgeStart} yrs</span>
                  </div>
                  <input
                    type="range"
                    min={Math.min(inputs.startAge || 40, 50)}
                    max={inputs.rothConvAgeEnd || 70}
                    step={1}
                    value={inputs.rothConvAgeStart}
                    onChange={(e) => handleChange('rothConvAgeStart', Number(e.target.value))}
                  />
                </div>

                <div className="input-group">
                  <div className="input-header">
                    <span>Conversion End Age</span>
                    <span className="input-value">{inputs.rothConvAgeEnd} yrs</span>
                  </div>
                  <input
                    type="range"
                    min={inputs.rothConvAgeStart || 50}
                    max={85}
                    step={1}
                    value={inputs.rothConvAgeEnd}
                    onChange={(e) => handleChange('rothConvAgeEnd', Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* Required Minimum Distributions (RMD @ 75) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span>Required Minimum Distributions (RMD)</span>
              <button
                onClick={() => handleChange('enableRmd', !inputs.enableRmd)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: inputs.enableRmd ? 'var(--accent-primary)' : 'var(--text-dim)' }}
              >
                {inputs.enableRmd ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
              </button>
            </div>

            {inputs.enableRmd && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px', borderLeft: '2px solid var(--accent-primary)' }}>
                <div className="input-group">
                  <div className="input-header">
                    <span>RMD Start Age</span>
                    <span className="input-value">Age {inputs.rmdStartAge}</span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={75}
                    step={1}
                    value={inputs.rmdStartAge}
                    onChange={(e) => handleChange('rmdStartAge', Number(e.target.value))}
                  />
                </div>

                <div className="input-group">
                  <div className="input-header">
                    <span>RMD Rate @ 75yr (%)</span>
                    <span className="input-value">{(inputs.rmdRate * 100).toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.01}
                    max={0.25}
                    step={0.005}
                    value={inputs.rmdRate}
                    onChange={(e) => handleChange('rmdRate', Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. SOCIAL SECURITY & PENSIONS (COLLAPSIBLE) */}
      <div style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '12px' }}>
        <button
          onClick={() => toggleSection('socialSecurity')}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Landmark size={15} color="var(--accent-success)" /> Social Security & Payouts
          </span>
          {openSection.socialSecurity ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {openSection.socialSecurity && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Include Social Security</span>
              <button
                onClick={() => handleChange('enableSocialSecurity', !inputs.enableSocialSecurity)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: inputs.enableSocialSecurity ? 'var(--accent-success)' : 'var(--text-dim)' }}
              >
                {inputs.enableSocialSecurity ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
              </button>
            </div>

            {inputs.enableSocialSecurity && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px', borderLeft: '2px solid var(--accent-success)' }}>
                <div className="input-group">
                  <div className="input-header">
                    <span>Claiming Start Age</span>
                    <span className="input-value">{inputs.ssAge} yrs</span>
                  </div>
                  <input
                    type="range"
                    min={62}
                    max={70}
                    step={1}
                    value={inputs.ssAge}
                    onChange={(e) => handleChange('ssAge', Number(e.target.value))}
                  />
                </div>

                <div className="input-group">
                  <div className="input-header">
                    <span>Primary Annual Benefit</span>
                    <span className="input-value">{formatCurrency(inputs.ssAnnualA)}/yr</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={60000}
                    step={1000}
                    value={inputs.ssAnnualA}
                    onChange={(e) => handleChange('ssAnnualA', Number(e.target.value))}
                  />
                </div>

                <div className="input-group">
                  <div className="input-header">
                    <span>Spouse / Partner Benefit</span>
                    <span className="input-value">{formatCurrency(inputs.ssAnnualB)}/yr</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={60000}
                    step={1000}
                    value={inputs.ssAnnualB}
                    onChange={(e) => handleChange('ssAnnualB', Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. RETIREMENT & SENIOR ADJUSTMENTS (COLLAPSIBLE) */}
      <div>
        <button
          onClick={() => toggleSection('advanced')}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <span>Retirement Expense Multipliers</span>
          {openSection.advanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {openSection.advanced && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            {/* Travel Adjustment Multipliers */}
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
              <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                ✈️ Travel Multipliers (Spreadsheet)
              </span>

              <div className="input-group">
                <div className="input-header">
                  <span>Travel Multiplier (Early Retirement)</span>
                  <span className="input-value">{inputs.travelAdjRetire.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={5.0}
                  step={0.1}
                  value={inputs.travelAdjRetire}
                  onChange={(e) => handleChange('travelAdjRetire', Number(e.target.value))}
                />
              </div>

              <div className="input-group">
                <div className="input-header">
                  <span>Travel Multiplier (Post-Age 75)</span>
                  <span className="input-value">{inputs.travelAdj75.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={2.0}
                  step={0.1}
                  value={inputs.travelAdj75}
                  onChange={(e) => handleChange('travelAdj75', Number(e.target.value))}
                />
              </div>
            </div>

            {/* Medical Insurance & Medicare Multipliers */}
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
              <span style={{ fontSize: '11px', color: 'var(--accent-warning)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                🏥 Medical & Medicare Multipliers (Spreadsheet)
              </span>

              <div className="input-group">
                <div className="input-header">
                  <span>Medicare Start Age</span>
                  <span className="input-value">Age {inputs.medicareStartAge}</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={72}
                  step={1}
                  value={inputs.medicareStartAge}
                  onChange={(e) => handleChange('medicareStartAge', Number(e.target.value))}
                />
              </div>

              <div className="input-group">
                <div className="input-header">
                  <span>Medical Multiplier (Retirement pre-Medicare)</span>
                  <span className="input-value">{inputs.medicalAdjRetirement.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={8.0}
                  step={0.25}
                  value={inputs.medicalAdjRetirement}
                  onChange={(e) => handleChange('medicalAdjRetirement', Number(e.target.value))}
                />
              </div>

              <div className="input-group">
                <div className="input-header">
                  <span>Medical Multiplier (Post-Medicare)</span>
                  <span className="input-value">{inputs.medicalAdjMedicare.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={8.0}
                  step={0.25}
                  value={inputs.medicalAdjMedicare}
                  onChange={(e) => handleChange('medicalAdjMedicare', Number(e.target.value))}
                />
              </div>
            </div>

            {/* Senior Expense Reduction Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Senior Expense Reduction @ Age 75</span>
              <button
                onClick={() => handleChange('reduceExpensesAt75', !inputs.reduceExpensesAt75)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: inputs.reduceExpensesAt75 ? 'var(--accent-cyan)' : 'var(--text-dim)' }}
              >
                {inputs.reduceExpensesAt75 ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Automatically scales travel down to the post-75 multiplier ({inputs.travelAdj75}x) and living expenses by 25% post-75.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
