import React, { useState, useMemo } from 'react';
import { HoldingCalculated, AssetCategory, Account } from '../types/investment';
import { RangeBar52Wk } from './RangeBar52Wk';
import { Plus, Trash2, Search } from 'lucide-react';

interface HoldingsTableProps {
  holdings: HoldingCalculated[];
  accounts: Account[];
  onAddPositionClick: () => void;
  onDeletePosition: (id: string) => void;
  activeAccountId: string;
}

const CATEGORY_TABS: { key: 'ALL' | AssetCategory; label: string }[] = [
  { key: 'ALL', label: 'All Assets' },
  { key: 'Stock', label: 'Stocks' },
  { key: 'Dividend', label: 'High Dividend' },
  { key: 'Berkshire', label: 'Berkshire Portfolio' },
  { key: 'ETF', label: 'ETFs' },
  { key: 'MutualFund', label: 'Mutual Funds' },
];

export const HoldingsTable: React.FC<HoldingsTableProps> = ({
  holdings,
  accounts,
  onAddPositionClick,
  onDeletePosition,
  activeAccountId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | AssetCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const accountMap = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach((acc) => map.set(acc.id, acc));
    return map;
  }, [accounts]);

  const filteredHoldings = useMemo(() => {
    return holdings.filter((h) => {
      // Filter by category
      if (selectedCategory !== 'ALL' && h.category !== selectedCategory) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const symbolMatch = h.symbol.toLowerCase().includes(q);
        const nameMatch = h.name?.toLowerCase().includes(q);
        if (!symbolMatch && !nameMatch) return false;
      }
      return true;
    });
  }, [holdings, selectedCategory, searchQuery]);

  const formatCurrency = (val: number, decimals: number = 2) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals }).format(val);

  return (
    <div className="glass-panel table-panel">
      {/* Table Toolbar */}
      <div className="table-toolbar">
        {/* Category Tabs */}
        <div className="category-filter-group">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedCategory(tab.key)}
              className={`btn-filter ${selectedCategory === tab.key ? 'btn-filter-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Add Action */}
        <div className="table-actions-right">
          <div className="search-input-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search ticker or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <button onClick={onAddPositionClick} className="btn btn-primary btn-sm">
            <Plus size={15} />
            <span>Add Position</span>
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="table-scroll-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Symbol / Asset</th>
              {activeAccountId === 'ALL' && <th>Account</th>}
              <th>Category</th>
              <th className="text-right">Shares</th>
              <th className="text-right">Purchase Price</th>
              <th className="text-right">Cost Basis</th>
              <th className="text-right">Market Price</th>
              <th className="text-right">Total Value</th>
              <th className="text-right">Unrealized P/L</th>
              <th className="text-right">Day Change</th>
              <th className="text-center" style={{ minWidth: '160px' }}>52-Week Range</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredHoldings.length === 0 ? (
              <tr>
                <td colSpan={activeAccountId === 'ALL' ? 12 : 11} className="empty-table-cell">
                  No investment holdings found matching the filter. Click "Add Position" to record a holding lot.
                </td>
              </tr>
            ) : (
              filteredHoldings.map((h) => {
                const isGain = h.unrealizedGainLoss >= 0;
                const isDayGain = h.dayGainLoss >= 0;
                const acc = accountMap.get(h.accountId);

                return (
                  <tr key={h.id} className="table-row-hover">
                    {/* Symbol & Name */}
                    <td>
                      <div className="symbol-cell">
                        <span className="symbol-ticker">{h.symbol}</span>
                        <span className="symbol-name">{h.name || h.symbol}</span>
                      </div>
                    </td>

                    {/* Account Badge (if viewing all) */}
                    {activeAccountId === 'ALL' && (
                      <td>
                        <span className="badge-account" title={acc?.description}>
                          {acc?.name || 'Account'}
                        </span>
                      </td>
                    )}

                    {/* Category */}
                    <td>
                      <span className={`badge-category badge-cat-${h.category.toLowerCase()}`}>
                        {h.category}
                      </span>
                    </td>

                    {/* Shares */}
                    <td className="text-right font-mono font-medium">
                      {h.shares.toLocaleString()}
                    </td>

                    {/* Purchase Price */}
                    <td className="text-right font-mono text-muted">
                      {formatCurrency(h.purchasePrice)}
                      <div className="text-xs text-dim">{h.purchaseDate}</div>
                    </td>

                    {/* Cost Basis */}
                    <td className="text-right font-mono font-medium">
                      {formatCurrency(h.costBasis)}
                    </td>

                    {/* Today's Market Price */}
                    <td className="text-right font-mono font-bold">
                      {formatCurrency(h.currentPrice)}
                      {h.isStale && <span className="stale-dot" title="Cached Price" />}
                    </td>

                    {/* Today's Total Value */}
                    <td className="text-right font-mono font-bold text-main">
                      {formatCurrency(h.currentValue)}
                    </td>

                    {/* Unrealized Gain / Loss */}
                    <td className="text-right font-mono">
                      <div className={`font-bold ${isGain ? 'text-success' : 'text-danger'}`}>
                        {isGain ? '+' : ''}{formatCurrency(h.unrealizedGainLoss)}
                      </div>
                      <div className={`text-xs ${isGain ? 'text-success' : 'text-danger'}`}>
                        {isGain ? '+' : ''}{h.unrealizedGainLossPercent.toFixed(2)}%
                      </div>
                    </td>

                    {/* Day Change */}
                    <td className="text-right font-mono">
                      <div className={isDayGain ? 'text-success' : 'text-danger'}>
                        {isDayGain ? '+' : ''}{formatCurrency(h.dayGainLoss)}
                      </div>
                      <div className="text-xs text-dim">
                        {isDayGain ? '+' : ''}{h.dayGainLossPercent.toFixed(2)}%
                      </div>
                    </td>

                    {/* 52-Week Range Bar */}
                    <td>
                      <RangeBar52Wk
                        currentPrice={h.currentPrice}
                        low={h.fiftyTwoWeekLow}
                        high={h.fiftyTwoWeekHigh}
                      />
                    </td>

                    {/* Action */}
                    <td className="text-center">
                      <button
                        onClick={() => onDeletePosition(h.id)}
                        className="btn-icon-delete"
                        title="Delete position lot"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
