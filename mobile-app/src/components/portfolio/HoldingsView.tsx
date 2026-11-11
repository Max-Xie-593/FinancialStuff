import React, { useState, useMemo } from 'react';
import { HoldingCalculated, AssetCategory, Account } from '../../types/investment';
import { HoldingsTable } from './HoldingsTable';
import { RangeBar52Wk } from './RangeBar52Wk';
import {
  Plus,
  Trash2,
  Search,
  LayoutGrid,
  Table as TableIcon,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpDown,
  Pencil,
} from 'lucide-react';

interface Props {
  holdings: HoldingCalculated[];
  accounts: Account[];
  onAddPositionClick: () => void;
  onDeletePosition: (id: string) => void;
  onEditPosition: (holding: HoldingCalculated) => void;
  activeAccountId: string;
  selectedCategory: 'ALL' | AssetCategory;
  onSelectCategory: (category: 'ALL' | AssetCategory) => void;
}

const CATEGORY_TABS: { key: 'ALL' | AssetCategory; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'Stock', label: 'Stocks' },
  { key: 'Dividend', label: 'Dividend' },
  { key: 'Berkshire', label: 'Berkshire' },
  { key: 'ETF', label: 'ETFs' },
  { key: 'MutualFund', label: 'Funds' },
];

export const HoldingsView: React.FC<Props> = ({
  holdings,
  accounts,
  onAddPositionClick,
  onDeletePosition,
  onEditPosition,
  activeAccountId,
  selectedCategory,
  onSelectCategory,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'value' | 'dayGain' | 'unrealized' | 'symbol'>('value');

  const accountMap = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  // Filter holdings
  const filteredHoldings = useMemo(() => {
    let list = holdings;

    // Filter by category
    if (selectedCategory !== 'ALL') {
      list = list.filter((h) => h.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (h) =>
          h.symbol.toLowerCase().includes(q) ||
          (h.name && h.name.toLowerCase().includes(q))
      );
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sortBy === 'value') return b.currentValue - a.currentValue;
      if (sortBy === 'dayGain') return b.dayGainLoss - a.dayGainLoss;
      if (sortBy === 'unrealized') return b.unrealizedGainLoss - a.unrealizedGainLoss;
      if (sortBy === 'symbol') return a.symbol.localeCompare(b.symbol);
      return 0;
    });
  }, [holdings, selectedCategory, searchQuery, sortBy]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="holdings-view-container">
      {/* Header Controls: Search, View Mode Toggle, Add Position */}
      <div className="holdings-controls-bar">
        <div className="search-input-wrapper" style={{ position: 'relative', width: '100%' }}>
          <Search size={15} className="search-icon" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-dim)', zIndex: 2 }} />
          <input
            type="text"
            className="mobile-search-field"
            placeholder="Search symbol or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px', width: '100%' }}
          />
        </div>

        <div className="holdings-action-group">
          {/* View Toggle */}
          <div className="segmented-view-toggle">
            <button
              type="button"
              className={`segment-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Card View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`segment-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <TableIcon size={15} />
            </button>
          </div>

          <button
            type="button"
            className="btn-add-position"
            onClick={onAddPositionClick}
          >
            <Plus size={16} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="category-scroll-strip">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`category-pill ${selectedCategory === tab.key ? 'active' : ''}`}
            onClick={() => onSelectCategory(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main View Area */}
      {viewMode === 'table' ? (
        <div className="holdings-table-wrapper">
          <HoldingsTable
            holdings={filteredHoldings}
            accounts={accounts}
            onAddPositionClick={onAddPositionClick}
            onDeletePosition={onDeletePosition}
            onEditPosition={onEditPosition}
            activeAccountId={activeAccountId}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
          />
        </div>
      ) : (
        /* Mobile Cards View */
        <div className="holding-cards-list">
          {filteredHoldings.length === 0 ? (
            <div className="glass-panel empty-card-msg">
              <p>No holdings found matching your filter.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onAddPositionClick}
              >
                <Plus size={14} /> Add First Position
              </button>
            </div>
          ) : (
            filteredHoldings.map((h) => {
              const isGain = h.unrealizedGainLoss >= 0;
              const isDayGain = h.dayGainLoss >= 0;
              const acc = accountMap.get(h.accountId);

              return (
                <div key={h.id} className="glass-panel mobile-holding-card">
                  {/* Card Header */}
                  <div className="card-top-row">
                    <div className="card-symbol-group">
                      <span className="card-ticker">{h.symbol}</span>
                      <span className="card-name">{h.name || h.symbol}</span>
                    </div>

                    <div className="card-value-group">
                      <span className="card-total-value">
                        {formatCurrency(h.currentValue)}
                      </span>
                      <span className={`card-day-badge ${isDayGain ? 'positive' : 'negative'}`}>
                        {isDayGain ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {isDayGain ? '+' : ''}{formatCurrency(h.dayGainLoss)} ({isDayGain ? '+' : ''}{h.dayGainLossPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {/* Card Sub-details */}
                  <div className="card-details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Shares</span>
                      <span className="detail-val">{h.shares.toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Price</span>
                      <span className="detail-val">
                        ${h.currentPrice.toFixed(2)}
                        {h.isStale && <span className="stale-dot" title="Cached" />}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Avg Cost</span>
                      <span className="detail-val">${h.purchasePrice.toFixed(2)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Total Gain/Loss</span>
                      <span className={`detail-val ${isGain ? 'text-success' : 'text-danger'}`}>
                        {isGain ? '+' : ''}{formatCurrency(h.unrealizedGainLoss)} ({isGain ? '+' : ''}{h.unrealizedGainLossPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* 52-Wk Range Bar */}
                  {h.fiftyTwoWeekHigh > 0 && h.fiftyTwoWeekLow > 0 && (
                    <div className="card-range-row">
                      <RangeBar52Wk
                        currentPrice={h.currentPrice}
                        low={h.fiftyTwoWeekLow}
                        high={h.fiftyTwoWeekHigh}
                        targetBuyPct={0.674}
                      />
                    </div>
                  )}

                  {/* Card Footer: Badges & Actions */}
                  <div className="card-footer-row">
                    <div className="badge-group">
                      <span className="card-pill category">{h.category}</span>
                      {acc && <span className="card-pill account">{acc.name}</span>}
                    </div>

                    <div className="card-actions-group" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className="card-edit-btn"
                        onClick={() => onEditPosition(h)}
                        title={`Edit ${h.symbol} lot`}
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="card-delete-btn"
                        onClick={() => {
                          if (window.confirm(`Delete ${h.symbol} lot from ${acc?.name || 'portfolio'}?`)) {
                            onDeletePosition(h.id);
                          }
                        }}
                        title="Delete Holding Lot"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
