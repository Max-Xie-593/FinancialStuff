import React, { useState, useMemo } from 'react';
import { DEFAULT_INPUTS, FinancialInputs, runFinanceProjection } from './engine/financeEngine';
import { ScenarioControls } from './components/ScenarioControls';
import { ProjectionChart } from './components/ProjectionChart';
import { YearlyLedger } from './components/YearlyLedger';
import { BudgetEnvelope } from './components/BudgetEnvelope';
import { TrendingUp, BarChart3, Wallet, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [inputs, setInputs] = useState<FinancialInputs>(() => {
    const saved = localStorage.getItem('pfp_user_inputs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_INPUTS;
      }
    }
    return DEFAULT_INPUTS;
  });

  const [activeTab, setActiveTab] = useState<'chart' | 'ledger' | 'budget'>('chart');

  // Handle Input Changes with LocalStorage auto-save
  const handleInputChange = (updated: FinancialInputs) => {
    setInputs(updated);
    localStorage.setItem('pfp_user_inputs', JSON.stringify(updated));
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    localStorage.removeItem('pfp_user_inputs');
  };

  // Run 60-Year Financial Projection Engine
  const projections = useMemo(() => {
    return runFinanceProjection(inputs);
  }, [inputs]);

  // Derived Metrics
  const age100Data = projections[projections.length - 1];
  const retirementYearData = projections.find((p) => p.age === inputs.retirementAge) || projections[0];
  const currentNetWorth = inputs.initCash + inputs.initGrowthInv + inputs.initBalanceInv + inputs.init401k + inputs.initRoth + inputs.initEdu + inputs.initProperty;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="app-container">
      {/* Header Bar */}
      <header className="app-header">
        <div className="header-title-group">
          <div className="header-icon">
            <TrendingUp size={24} />
          </div>
          <div>
            <h1 className="header-title">Personal Finance Planner</h1>
            <p className="header-subtitle">60-Year Wealth Projection Engine & Retirement Simulator</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`}
            onClick={() => setActiveTab('chart')}
          >
            <TrendingUp size={15} style={{ flexShrink: 0 }} />
            <span className="tab-text-full">Projection Trajectory</span>
            <span className="tab-text-short">Trajectory</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => setActiveTab('ledger')}
          >
            <BarChart3 size={15} style={{ flexShrink: 0 }} />
            <span className="tab-text-full">60-Year Ledger</span>
            <span className="tab-text-short">Ledger</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
            onClick={() => setActiveTab('budget')}
          >
            <Wallet size={15} style={{ flexShrink: 0 }} />
            <span className="tab-text-full">Budget Envelopes</span>
            <span className="tab-text-short">Budget</span>
          </button>
        </nav>
      </header>

      {/* Summary Metrics Bar */}
      <div className="metrics-grid">
        <div className="glass-panel metric-card">
          <span className="metric-label">Current Net Worth (Age {inputs.startAge})</span>
          <span className="metric-value" style={{ color: 'var(--accent-cyan)' }}>
            {formatCurrency(currentNetWorth)}
          </span>
          <span className="metric-change positive">
            <ShieldCheck size={12} /> Starting Capital Basis
          </span>
        </div>

        <div className="glass-panel metric-card">
          <span className="metric-label">Net Worth @ Retirement (Age {inputs.retirementAge})</span>
          <span className="metric-value" style={{ color: 'var(--accent-primary)' }}>
            {formatCurrency(retirementYearData?.totalAssets || 0)}
          </span>
          <span className="metric-change positive">
            Target Retirement Threshold
          </span>
        </div>

        <div className="glass-panel metric-card">
          <span className="metric-label">Terminal Net Worth (Age 100)</span>
          <span
            className="metric-value"
            style={{ color: (age100Data?.totalAssets || 0) > 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}
          >
            {formatCurrency(age100Data?.totalAssets || 0)}
          </span>
          <span className={age100Data?.totalAssets > 0 ? 'metric-change positive' : 'metric-change danger'}>
            {age100Data?.totalAssets > 0 ? 'Fully Solvent' : 'Depleted Risk'}
          </span>
        </div>

        <div className="glass-panel metric-card">
          <span className="metric-label">Est. Tax Savings (401k/Roth)</span>
          <span className="metric-value" style={{ color: 'var(--accent-purple)' }}>
            {formatCurrency(inputs.pretax401kLimit * 0.22 + inputs.rothContribution * 0.22)}
          </span>
          <span className="metric-change positive">
            Annual Pre-tax Advantage
          </span>
        </div>
      </div>

      {/* Main Grid: Controls + Interactive Main View */}
      <div className="dashboard-grid">
        {/* Left Sidebar: Controls */}
        <ScenarioControls inputs={inputs} onChange={handleInputChange} onReset={handleReset} />

        {/* Right Main Panel */}
        <div>
          {activeTab === 'chart' && (
            <ProjectionChart projections={projections} retirementAge={inputs.retirementAge} />
          )}

          {activeTab === 'ledger' && (
            <YearlyLedger projections={projections} />
          )}

          {activeTab === 'budget' && (
            <BudgetEnvelope inputs={inputs} onChange={handleInputChange} />
          )}
        </div>
      </div>
    </div>
  );
};
export default App;
