import React, { useState, useMemo } from 'react';
import { GridSimInputs } from '../types/investment';
import { runGridSimulation, DEFAULT_GRID_INPUTS } from '../engine/gridEngine';
import { Sliders, RotateCcw, TrendingUp, DollarSign, Layers } from 'lucide-react';

interface GridSimulatorProps {
  initialInputs?: GridSimInputs;
  onSaveInputs?: (inputs: GridSimInputs) => void;
}

export const GridSimulator: React.FC<GridSimulatorProps> = ({
  initialInputs = DEFAULT_GRID_INPUTS,
  onSaveInputs,
}) => {
  const [inputs, setInputs] = useState<GridSimInputs>(initialInputs);

  const updateInput = <K extends keyof GridSimInputs>(key: K, value: GridSimInputs[K]) => {
    const updated = { ...inputs, [key]: value };
    setInputs(updated);
    onSaveInputs?.(updated);
  };

  const simulation = useMemo(() => {
    return runGridSimulation(inputs);
  }, [inputs]);

  const formatCurrency = (val: number, decimals: number = 2) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals }).format(val);

  const isProfitable = simulation.totalGainLoss >= 0;

  return (
    <div className="space-y-6">
      {/* Simulation Concept Banner */}
      <div className="glass-panel info-banner">
        <div className="info-banner-icon">
          <Sliders size={24} className="text-purple" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-main">Return Estimation Grid Simulator (Mathematical Engine)</h3>
          <p className="text-sm text-muted">
            Models systematic dollar-cost averaging down across price pullbacks from a 52-week High.
            Simulates holding periods, tier proceeds, and total portfolio return upon reaching your target exit percentage.
          </p>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="summary-cards-grid">
        <div className="glass-panel stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Capital Committed</span>
            <div className="stat-icon-wrapper bg-blue-subtle">
              <DollarSign size={18} className="text-primary" />
            </div>
          </div>
          <div className="stat-card-value">{formatCurrency(simulation.totalCashInvested, 0)}</div>
          <div className="stat-card-subtext">Across {simulation.tiers.length} buying tiers</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Projected Exit Proceeds</span>
            <div className="stat-icon-wrapper bg-purple-subtle">
              <Layers size={18} className="text-purple" />
            </div>
          </div>
          <div className="stat-card-value">{formatCurrency(simulation.totalProceeds, 0)}</div>
          <div className="stat-card-subtext">Target Sell at {(inputs.sellPct * 100).toFixed(0)}% of 52W High</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Projected Net Strategy Return</span>
            <div className={`stat-icon-wrapper ${isProfitable ? 'bg-success-subtle' : 'bg-danger-subtle'}`}>
              <TrendingUp size={18} className={isProfitable ? 'text-success' : 'text-danger'} />
            </div>
          </div>
          <div className={`stat-card-value ${isProfitable ? 'text-success' : 'text-danger'}`}>
            {isProfitable ? '+' : ''}{formatCurrency(simulation.totalGainLoss, 0)}
          </div>
          <div className="stat-card-subtext">
            <span className={`pill ${isProfitable ? 'pill-success' : 'pill-danger'}`}>
              {isProfitable ? '+' : ''}{(simulation.totalGainLossPercent * 100).toFixed(2)}% Overall Gain
            </span>
          </div>
        </div>
      </div>

      {/* Scenario Control Panel */}
      <div className="glass-panel p-6">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-md font-bold text-main flex items-center gap-2">
            <Sliders size={18} className="text-primary" />
            Scenario Parameters
          </h4>

          {/* Quick Preset Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setInputs(DEFAULT_GRID_INPUTS);
                onSaveInputs?.(DEFAULT_GRID_INPUTS);
              }}
              className="btn btn-secondary btn-sm"
              title="Reset parameters to original Excel template values"
            >
              <RotateCcw size={14} />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Step Cash ($) */}
          <div className="form-group">
            <div className="flex justify-between">
              <label className="form-label">Step Cash per Tier ($)</label>
              <span className="font-mono text-sm font-bold text-primary">{formatCurrency(inputs.stepCash, 0)}</span>
            </div>
            <input
              type="range"
              min={1000}
              max={100000}
              step={1000}
              value={inputs.stepCash}
              onChange={(e) => updateInput('stepCash', parseFloat(e.target.value))}
              className="slider-input"
            />
          </div>

          {/* 52-Week High ($) */}
          <div className="form-group">
            <div className="flex justify-between">
              <label className="form-label">52-Week High ($)</label>
              <span className="font-mono text-sm font-bold text-primary">${inputs.high52wk.toFixed(2)}</span>
            </div>
            <input
              type="number"
              step="1"
              value={inputs.high52wk}
              onChange={(e) => updateInput('high52wk', parseFloat(e.target.value) || 0)}
              className="form-input"
            />
          </div>

          {/* Start Buy % of High */}
          <div className="form-group">
            <div className="flex justify-between">
              <label className="form-label">Start Buy % of High</label>
              <span className="font-mono text-sm font-bold text-success">{(inputs.startBuyPct * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={0.3}
              max={0.9}
              step={0.005}
              value={inputs.startBuyPct}
              onChange={(e) => updateInput('startBuyPct', parseFloat(e.target.value))}
              className="slider-input"
            />
          </div>

          {/* Buy Step % */}
          <div className="form-group">
            <div className="flex justify-between">
              <label className="form-label">Step Drop between Tiers</label>
              <span className="font-mono text-sm font-bold text-primary">{(inputs.buyStepPct * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={0.02}
              max={0.2}
              step={0.01}
              value={inputs.buyStepPct}
              onChange={(e) => updateInput('buyStepPct', parseFloat(e.target.value))}
              className="slider-input"
            />
          </div>

          {/* Sell % of High */}
          <div className="form-group">
            <div className="flex justify-between">
              <label className="form-label">Target Sell % of High</label>
              <span className="font-mono text-sm font-bold text-purple">{(inputs.sellPct * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1.2}
              step={0.01}
              value={inputs.sellPct}
              onChange={(e) => updateInput('sellPct', parseFloat(e.target.value))}
              className="slider-input"
            />
          </div>

          {/* Cycle Duration (Years) */}
          <div className="form-group">
            <div className="flex justify-between">
              <label className="form-label">High-Low-High Cycle (Yrs)</label>
              <span className="font-mono text-sm font-bold text-cyan">{inputs.cycleYears} Years</span>
            </div>
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={inputs.cycleYears}
              onChange={(e) => updateInput('cycleYears', parseInt(e.target.value))}
              className="slider-input"
            />
          </div>

          {/* Number of Tiers */}
          <div className="form-group">
            <div className="flex justify-between">
              <label className="form-label">Number of Tiers</label>
              <span className="font-mono text-sm font-bold text-main">{inputs.numTiers}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={inputs.numTiers}
              onChange={(e) => updateInput('numTiers', parseInt(e.target.value))}
              className="slider-input"
            />
          </div>
        </div>
      </div>

      {/* Tier Breakdown Table */}
      <div className="glass-panel table-panel">
        <div className="p-4 border-b border-card flex justify-between items-center">
          <h4 className="font-bold text-main">Systematic Tier Execution Breakdown</h4>
          <span className="text-xs text-muted">Calculates holding period = Cycle Yrs × Buy % × Sell %</span>
        </div>

        <div className="table-scroll-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="text-center">Tier #</th>
                <th className="text-right">Cash Invested</th>
                <th className="text-right">Buy % of High</th>
                <th className="text-right">Buy Price</th>
                <th className="text-right">Shares Bought</th>
                <th className="text-right">Target Sell Price</th>
                <th className="text-right">Est. Years Held</th>
                <th className="text-right">Total Proceeds</th>
                <th className="text-right">Projected Gain/Loss</th>
                <th className="text-right">Return %</th>
              </tr>
            </thead>
            <tbody>
              {simulation.tiers.map((t) => {
                const isTierGain = t.gainLoss >= 0;
                return (
                  <tr key={t.tier} className="table-row-hover">
                    <td className="text-center font-bold text-primary">Tier {t.tier}</td>
                    <td className="text-right font-mono">{formatCurrency(t.cashInvested, 0)}</td>
                    <td className="text-right font-mono font-medium">{(t.buyPctOfHigh * 100).toFixed(1)}%</td>
                    <td className="text-right font-mono font-bold text-main">{formatCurrency(t.buyPrice)}</td>
                    <td className="text-right font-mono text-muted">{t.sharesBought.toFixed(2)}</td>
                    <td className="text-right font-mono text-purple">{formatCurrency(t.sellPrice)}</td>
                    <td className="text-right font-mono text-cyan">{t.yearsHeld.toFixed(2)} yrs</td>
                    <td className="text-right font-mono font-bold">{formatCurrency(t.proceeds, 0)}</td>
                    <td className={`text-right font-mono font-bold ${isTierGain ? 'text-success' : 'text-danger'}`}>
                      {isTierGain ? '+' : ''}{formatCurrency(t.gainLoss, 0)}
                    </td>
                    <td className="text-right font-mono">
                      <span className={`pill ${isTierGain ? 'pill-success' : 'pill-danger'}`}>
                        {isTierGain ? '+' : ''}{(t.gainLossPercent * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-dark-subtle">
                <td className="text-center">TOTALS</td>
                <td className="text-right font-mono">{formatCurrency(simulation.totalCashInvested, 0)}</td>
                <td colSpan={4}></td>
                <td className="text-right text-xs text-muted">Summary</td>
                <td className="text-right font-mono">{formatCurrency(simulation.totalProceeds, 0)}</td>
                <td className={`text-right font-mono ${isProfitable ? 'text-success' : 'text-danger'}`}>
                  {isProfitable ? '+' : ''}{formatCurrency(simulation.totalGainLoss, 0)}
                </td>
                <td className="text-right font-mono">
                  <span className={`pill ${isProfitable ? 'pill-success' : 'pill-danger'}`}>
                    {isProfitable ? '+' : ''}{(simulation.totalGainLossPercent * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
