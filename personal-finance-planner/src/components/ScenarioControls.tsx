import React, { useState } from 'react';
import { FinancialInputs, DEFAULT_INPUTS } from '../engine/financeEngine';
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
} from 'lucide-react';

interface Props {
  inputs: FinancialInputs;
  onChange: (updated: FinancialInputs) => void;
  onReset: () => void;
}

export const ScenarioControls: React.FC<Props> = ({ inputs, onChange, onReset }) => {
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
      <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          <Sparkles size={14} color="var(--accent-warning)" /> Load Scenario Preset:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <button
            onClick={() => applyPreset('default')}
            className="tab-btn"
            style={{ fontSize: '11px', padding: '6px', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}
          >
            Standard Excel
          </button>
          <button
            onClick={() => applyPreset('fire')}
            className="tab-btn"
            style={{ fontSize: '11px', padding: '6px', justifyContent: 'center', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-cyan)' }}
          >
            FIRE @ 48
          </button>
          <button
            onClick={() => applyPreset('conservative')}
            className="tab-btn"
            style={{ fontSize: '11px', padding: '6px', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}
          >
            Conservative
          </button>
          <button
            onClick={() => applyPreset('inflation_shock')}
            className="tab-btn"
            style={{ fontSize: '11px', padding: '6px', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)' }}
          >
            Inflation 4.5%
          </button>
        </div>
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
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--accent-cyan)' }}>📊 Replaying 1974–2024 Market Data:</strong>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Simulating year-by-year real S&P 500 & FBALX volatility (1974 bear market, dot-com crash, 2008 crisis, 2020 covid, 2022 drawdown, and bull runs).
                </p>
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
                    max={50000}
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
                    min={50}
                    max={75}
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
                    min={Math.max(inputs.rothConvAgeStart + 1, 55)}
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

      {/* 7. ADVANCED SPENDING RULES (COLLAPSIBLE) */}
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
          <span>Senior Expense Reductions</span>
          {openSection.advanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {openSection.advanced && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Reduce Expenses @ Age 75</span>
              <button
                onClick={() => handleChange('reduceExpensesAt75', !inputs.reduceExpensesAt75)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: inputs.reduceExpensesAt75 ? 'var(--accent-cyan)' : 'var(--text-dim)' }}
              >
                {inputs.reduceExpensesAt75 ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Automatically reduces annual travel by 50% and living expenses by 25% post-75.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
