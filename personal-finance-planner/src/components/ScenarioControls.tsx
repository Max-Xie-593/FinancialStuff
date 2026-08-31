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
} from 'lucide-react';

interface Props {
  inputs: FinancialInputs;
  onChange: (updated: FinancialInputs) => void;
  onReset: () => void;
}

export const ScenarioControls: React.FC<Props> = ({ inputs, onChange, onReset }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (key: keyof FinancialInputs, value: any) => {
    onChange({
      ...inputs,
      [key]: value,
    });
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
        startAge: 35,
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
          <Sliders size={18} color="#3b82f6" /> Scenario Assumptions
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
          Reset
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

      {/* Core Milestones */}
      <div className="input-group">
        <div className="input-header">
          <span>Target Retirement Age</span>
          <span className="input-value">{inputs.retirementAge} yrs</span>
        </div>
        <input
          type="range"
          min={40}
          max={75}
          step={1}
          value={inputs.retirementAge}
          onChange={(e) => handleChange('retirementAge', Number(e.target.value))}
        />
      </div>

      {/* Current Income */}
      <div className="input-group">
        <div className="input-header">
          <span>Annual Gross Income</span>
          <span className="input-value">{formatCurrency(inputs.annualIncome)}</span>
        </div>
        <input
          type="range"
          min={30000}
          max={400000}
          step={5000}
          value={inputs.annualIncome}
          onChange={(e) => handleChange('annualIncome', Number(e.target.value))}
        />
      </div>

      {/* Annual Expenses */}
      <div className="input-group">
        <div className="input-header">
          <span>Annual Living Expenses</span>
          <span className="input-value">{formatCurrency(inputs.annualExpense)}</span>
        </div>
        <input
          type="range"
          min={20000}
          max={200000}
          step={2500}
          value={inputs.annualExpense}
          onChange={(e) => handleChange('annualExpense', Number(e.target.value))}
        />
      </div>

      <hr style={{ borderColor: 'var(--border-card)', margin: '4px 0 8px' }} />

      {/* Return & Inflation Rates */}
      <div className="section-title" style={{ fontSize: '13px', marginBottom: '8px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Percent size={14} color="#8b5cf6" /> Returns & Inflation
        </span>
      </div>

      <div className="input-group">
        <div className="input-header">
          <span>Growth Stocks ROI</span>
          <span className="input-value">{(inputs.rateGrowth * 100).toFixed(1)}%</span>
        </div>
        <input
          type="range"
          min={0.03}
          max={0.12}
          step={0.005}
          value={inputs.rateGrowth}
          onChange={(e) => handleChange('rateGrowth', Number(e.target.value))}
        />
      </div>

      <div className="input-group">
        <div className="input-header">
          <span>Inflation Rate</span>
          <span className="input-value">{(inputs.inflationRate * 100).toFixed(1)}%</span>
        </div>
        <input
          type="range"
          min={0.01}
          max={0.06}
          step={0.005}
          value={inputs.inflationRate}
          onChange={(e) => handleChange('inflationRate', Number(e.target.value))}
        />
      </div>

      <hr style={{ borderColor: 'var(--border-card)', margin: '4px 0 8px' }} />

      {/* Initial Balances */}
      <div className="section-title" style={{ fontSize: '13px', marginBottom: '8px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <DollarSign size={14} color="#10b981" /> Starting Balances (Age {inputs.startAge})
        </span>
      </div>

      <div className="input-group">
        <div className="input-header">
          <span>Starting 401(k) / IRA</span>
          <span className="input-value">{formatCurrency(inputs.init401k)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1000000}
          step={25000}
          value={inputs.init401k}
          onChange={(e) => handleChange('init401k', Number(e.target.value))}
        />
      </div>

      <div className="input-group">
        <div className="input-header">
          <span>Starting Cash Savings</span>
          <span className="input-value">{formatCurrency(inputs.initCash)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={300000}
          step={10000}
          value={inputs.initCash}
          onChange={(e) => handleChange('initCash', Number(e.target.value))}
        />
      </div>

      {/* Advanced Rules & Toggles Dropdown */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border-card)',
          borderRadius: '8px',
          padding: '10px 14px',
          color: 'var(--text-main)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          marginTop: '8px',
        }}
      >
        <span>Advanced Switches & Vehicles</span>
        {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showAdvanced && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px', fontSize: '13px' }}>
          {/* Social Security Switch */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Include Social Security</span>
            <button
              onClick={() => handleChange('enableSocialSecurity', !inputs.enableSocialSecurity)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: inputs.enableSocialSecurity ? 'var(--accent-success)' : 'var(--text-dim)' }}
            >
              {inputs.enableSocialSecurity ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </div>

          {inputs.enableSocialSecurity && (
            <div className="input-group" style={{ paddingLeft: '8px', borderLeft: '2px solid var(--accent-success)' }}>
              <div className="input-header">
                <span>SS Start Age</span>
                <span className="input-value">{inputs.ssAge} yrs</span>
              </div>
              <input
                type="range"
                min={62}
                max={70}
                value={inputs.ssAge}
                onChange={(e) => handleChange('ssAge', Number(e.target.value))}
              />
            </div>
          )}

          {/* 401(k) Employer Match Switch */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>401(k) Employer Match</span>
            <button
              onClick={() => handleChange('enable401kMatch', !inputs.enable401kMatch)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: inputs.enable401kMatch ? 'var(--accent-primary)' : 'var(--text-dim)' }}
            >
              {inputs.enable401kMatch ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </div>

          {/* Roth Conversion Window Switch */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Roth Conversions (Ages 60–70)</span>
            <button
              onClick={() => handleChange('enableRothConversion', !inputs.enableRothConversion)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: inputs.enableRothConversion ? 'var(--accent-purple)' : 'var(--text-dim)' }}
            >
              {inputs.enableRothConversion ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </div>

          {/* Senior Expense Reduction Switch */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Reduce Expenses @ Age 75</span>
            <button
              onClick={() => handleChange('reduceExpensesAt75', !inputs.reduceExpensesAt75)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: inputs.reduceExpensesAt75 ? 'var(--accent-cyan)' : 'var(--text-dim)' }}
            >
              {inputs.reduceExpensesAt75 ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
