import React, { useState } from 'react';
import { PortfolioSummary } from '../engine/portfolioEngine';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity } from 'lucide-react';
import { AssetCategory } from '../types/investment';

interface PortfolioSummaryCardsProps {
  summary: PortfolioSummary;
  overallTotalValue?: number;
  selectedCategory?: 'ALL' | AssetCategory;
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

const SECTOR_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#eab308', // Yellow
  '#64748b', // Slate
];

export const PortfolioSummaryCards: React.FC<PortfolioSummaryCardsProps> = ({
  summary,
  overallTotalValue,
  selectedCategory = 'ALL',
}) => {
  const [allocationMode, setAllocationMode] = useState<'sector' | 'assetClass'>('sector');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

  const isGain = summary.totalGainLoss >= 0;
  const isDayGain = summary.totalDayGainLoss >= 0;

  const isSubset = selectedCategory !== 'ALL';
  const categoryLabel = isSubset ? CATEGORY_LABELS[selectedCategory] : 'Portfolio';

  // Calculate what percentage this subset makes of the total account
  const pctOfAccount =
    overallTotalValue && overallTotalValue > 0
      ? (summary.totalCurrentValue / overallTotalValue) * 100
      : 100;

  // Prepare sector allocation sorted by value descending
  const sortedSectors = Object.entries(summary.sectorBreakdown || {})
    .filter(([_, data]) => data.value > 0)
    .sort((a, b) => b[1].value - a[1].value);

  return (
    <div className="summary-cards-grid">
      {/* 1. Total Value */}
      <div className="glass-panel stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">
            {isSubset ? `${categoryLabel} Value` : 'Total Portfolio Value'}
          </span>
          <div className="stat-icon-wrapper bg-blue-subtle">
            <DollarSign size={18} className="text-primary" />
          </div>
        </div>
        <div className="stat-card-value">{formatCurrency(summary.totalCurrentValue)}</div>
        <div className="stat-card-subtext flex items-center justify-between">
          <span className="text-muted">Cost Basis: {formatCurrency(summary.totalCostBasis)}</span>
          {isSubset && overallTotalValue !== undefined && overallTotalValue > 0 && (
            <span
              className="pill pill-primary"
              title={`${pctOfAccount.toFixed(1)}% of active account portfolio`}
            >
              {pctOfAccount.toFixed(1)}% of Account
            </span>
          )}
        </div>
      </div>

      {/* 2. Unrealized Total Gain / Loss */}
      <div className="glass-panel stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">
            {isSubset ? `${categoryLabel} Total Return` : 'Total Return (All-Time)'}
          </span>
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

      {/* 3. Day Change */}
      <div className="glass-panel stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">
            {isSubset ? `${categoryLabel} Day Change` : 'Day Change (Est.)'}
          </span>
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

      {/* 4. Asset / Sector Allocation Breakdown */}
      <div className="glass-panel stat-card allocation-card">
        <div className="stat-card-header">
          <div className="flex items-center gap-2">
            <div className="stat-icon-wrapper bg-purple-subtle" style={{ width: '28px', height: '28px' }}>
              <PieChart size={15} className="text-purple" />
            </div>
            <span className="stat-card-title">
              {isSubset
                ? `${categoryLabel} Breakdown`
                : allocationMode === 'sector'
                ? 'Industry / Sector Allocation'
                : 'Asset Class Allocation'}
            </span>
          </div>

          {!isSubset ? (
            <div className="allocation-mode-switcher">
              <button
                type="button"
                onClick={() => setAllocationMode('sector')}
                className={`switcher-btn ${allocationMode === 'sector' ? 'switcher-btn-active' : ''}`}
              >
                Sectors
              </button>
              <button
                type="button"
                onClick={() => setAllocationMode('assetClass')}
                className={`switcher-btn ${allocationMode === 'assetClass' ? 'switcher-btn-active' : ''}`}
              >
                Classes
              </button>
            </div>
          ) : (
            overallTotalValue !== undefined && overallTotalValue > 0 && (
              <span className="text-xs font-mono text-purple font-medium">
                {pctOfAccount.toFixed(1)}% of Portfolio
              </span>
            )
          )}
        </div>

        {/* Multi-Segment Allocation Bar */}
        <div className="allocation-progress-bar">
          {isSubset || allocationMode === 'sector' ? (
            sortedSectors.map(([sectorName, data], idx) => {
              const pct = summary.totalCurrentValue > 0 ? (data.value / summary.totalCurrentValue) * 100 : 0;
              if (pct < 0.5) return null;
              const color = SECTOR_COLORS[idx % SECTOR_COLORS.length];
              return (
                <div
                  key={sectorName}
                  className="allocation-bar-segment"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                  }}
                  title={`${sectorName}: ${formatCurrency(data.value)} (${pct.toFixed(1)}%)`}
                />
              );
            })
          ) : (
            (Object.keys(summary.categoryBreakdown) as AssetCategory[]).map((cat) => {
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
            })
          )}
        </div>

        {/* Legend */}
        <div className="allocation-legend">
          {isSubset || allocationMode === 'sector' ? (
            sortedSectors.length === 0 ? (
              <div className="text-xs text-dim italic">No sector data recorded for this asset subset</div>
            ) : (
              sortedSectors.map(([sectorName, data], idx) => {
                const pct = summary.totalCurrentValue > 0 ? (data.value / summary.totalCurrentValue) * 100 : 0;
                const color = SECTOR_COLORS[idx % SECTOR_COLORS.length];
                return (
                  <div key={sectorName} className="allocation-legend-item" title={`${data.count} position(s)`}>
                    <span className="legend-dot" style={{ backgroundColor: color }} />
                    <span className="legend-label">{sectorName}</span>
                    <span className="legend-pct">{pct.toFixed(1)}%</span>
                  </div>
                );
              })
            )
          ) : (
            (Object.keys(summary.categoryBreakdown) as AssetCategory[]).map((cat) => {
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
            })
          )}
        </div>
      </div>
    </div>
  );
};
