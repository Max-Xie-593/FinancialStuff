import React from 'react';
import { PortfolioSummary } from '../engine/portfolioEngine';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity } from 'lucide-react';
import { AssetCategory } from '../types/investment';

interface PortfolioSummaryCardsProps {
  summary: PortfolioSummary;
}

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  Stock: 'Stocks',
  Dividend: 'High Dividend',
  Berkshire: 'Berkshire Portfolio',
  ETF: 'ETFs',
  MutualFund: 'Mutual Funds',
};

const CATEGORY_COLORS: Record<AssetCategory, string> = {
  Stock: '#3b82f6',       // Blue
  Dividend: '#10b981',    // Green
  Berkshire: '#8b5cf6',   // Purple
  ETF: '#06b6d4',         // Cyan
  MutualFund: '#f59e0b',  // Amber
};

export const PortfolioSummaryCards: React.FC<PortfolioSummaryCardsProps> = ({ summary }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

  const isGain = summary.totalGainLoss >= 0;
  const isDayGain = summary.totalDayGainLoss >= 0;

  return (
    <div className="summary-cards-grid">
      {/* Total Portfolio Value */}
      <div className="glass-panel stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">Total Portfolio Value</span>
          <div className="stat-icon-wrapper bg-blue-subtle">
            <DollarSign size={18} className="text-primary" />
          </div>
        </div>
        <div className="stat-card-value">{formatCurrency(summary.totalCurrentValue)}</div>
        <div className="stat-card-subtext">
          <span className="text-muted">Cost Basis: {formatCurrency(summary.totalCostBasis)}</span>
        </div>
      </div>

      {/* Unrealized Total Gain / Loss */}
      <div className="glass-panel stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">Total Return (All-Time)</span>
          <div className={`stat-icon-wrapper ${isGain ? 'bg-success-subtle' : 'bg-danger-subtle'}`}>
            {isGain ? <TrendingUp size={18} className="text-success" /> : <TrendingDown size={18} className="text-danger" />}
          </div>
        </div>
        <div className={`stat-card-value ${isGain ? 'text-success' : 'text-danger'}`}>
          {isGain ? '+' : ''}{formatCurrency(summary.totalGainLoss)}
        </div>
        <div className="stat-card-subtext">
          <span className={`pill ${isGain ? 'pill-success' : 'pill-danger'}`}>
            {isGain ? '+' : ''}{summary.totalGainLossPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Day Change */}
      <div className="glass-panel stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">Day Change (Est.)</span>
          <div className={`stat-icon-wrapper ${isDayGain ? 'bg-success-subtle' : 'bg-danger-subtle'}`}>
            <Activity size={18} className={isDayGain ? 'text-success' : 'text-danger'} />
          </div>
        </div>
        <div className={`stat-card-value ${isDayGain ? 'text-success' : 'text-danger'}`}>
          {isDayGain ? '+' : ''}{formatCurrency(summary.totalDayGainLoss)}
        </div>
        <div className="stat-card-subtext">
          <span className={`pill ${isDayGain ? 'pill-success' : 'pill-danger'}`}>
            {isDayGain ? '+' : ''}{summary.totalDayGainLossPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Asset Allocation Breakdown */}
      <div className="glass-panel stat-card allocation-card">
        <div className="stat-card-header">
          <span className="stat-card-title">Asset Allocation</span>
          <div className="stat-icon-wrapper bg-purple-subtle">
            <PieChart size={18} className="text-purple" />
          </div>
        </div>

        {/* Multi-Segment Allocation Bar */}
        <div className="allocation-progress-bar">
          {(Object.keys(summary.categoryBreakdown) as AssetCategory[]).map((cat) => {
            const catVal = summary.categoryBreakdown[cat].value;
            const pct = summary.totalCurrentValue > 0 ? (catVal / summary.totalCurrentValue) * 100 : 0;
            if (pct < 0.5) return null;
            return (
              <div
                key={cat}
                className="allocation-bar-segment"
                style={{
                  width: `${pct}%`,
                  backgroundColor: CATEGORY_COLORS[cat],
                }}
                title={`${CATEGORY_LABELS[cat]}: ${formatCurrency(catVal)} (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="allocation-legend">
          {(Object.keys(summary.categoryBreakdown) as AssetCategory[]).map((cat) => {
            const catVal = summary.categoryBreakdown[cat].value;
            const pct = summary.totalCurrentValue > 0 ? (catVal / summary.totalCurrentValue) * 100 : 0;
            if (summary.categoryBreakdown[cat].count === 0) return null;
            return (
              <div key={cat} className="allocation-legend-item">
                <span className="legend-dot" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                <span className="legend-label">{CATEGORY_LABELS[cat]}</span>
                <span className="legend-pct">{pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
