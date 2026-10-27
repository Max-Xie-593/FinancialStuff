import React, { useState, useMemo } from 'react';
import { HoldingCalculated, AssetCategory, Account } from '../types/investment';
import { RangeBar52Wk } from './RangeBar52Wk';
import { Plus, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface HoldingsTableProps {
  holdings: HoldingCalculated[];
  accounts: Account[];
  onAddPositionClick: () => void;
  onDeletePosition: (id: string) => void;
  activeAccountId: string;
  selectedCategory?: 'ALL' | AssetCategory;
  onSelectCategory?: (category: 'ALL' | AssetCategory) => void;
}

type SortField =
  | 'symbol'
  | 'shares'
  | 'purchasePrice'
  | 'costBasis'
  | 'currentPrice'
  | 'dayChangePerShare'
  | 'currentValue'
  | 'dayGainLoss'
  | 'unrealizedGainLoss'
  | 'percentOf52WkHigh'
  | 'account'
  | 'industry'
  | 'category';

type SortDirection = 'asc' | 'desc';

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
  selectedCategory: propCategory,
  onSelectCategory: propOnSelectCategory,
}) => {
  const [internalCategory, setInternalCategory] = useState<'ALL' | AssetCategory>('ALL');
  const activeCategory = propCategory !== undefined ? propCategory : internalCategory;
  const setActiveCategory = propOnSelectCategory || setInternalCategory;

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('currentValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const accountMap = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach((acc) => map.set(acc.id, acc));
    return map;
  }, [accounts]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // Default text fields to ascending, numeric fields to descending
      const isText = ['symbol', 'account', 'industry', 'category'].includes(field);
      setSortDirection(isText ? 'asc' : 'desc');
    }
  };

  const filteredHoldings = useMemo(() => {
    return holdings.filter((h) => {
      // Filter by category
      if (activeCategory !== 'ALL' && h.category !== activeCategory) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const symbolMatch = h.symbol.toLowerCase().includes(q);
        const nameMatch = h.name?.toLowerCase().includes(q);
        const sectorMatch = h.sector?.toLowerCase().includes(q);
        const industryMatch = h.industry?.toLowerCase().includes(q);
        if (!symbolMatch && !nameMatch && !sectorMatch && !industryMatch) return false;
      }
      return true;
    });
  }, [holdings, activeCategory, searchQuery]);

  const sortedHoldings = useMemo(() => {
    return [...filteredHoldings].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'shares':
          comparison = a.shares - b.shares;
          break;
        case 'purchasePrice':
          comparison = a.purchasePrice - b.purchasePrice;
          break;
        case 'costBasis':
          comparison = a.costBasis - b.costBasis;
          break;
        case 'currentPrice':
          comparison = a.currentPrice - b.currentPrice;
          break;
        case 'dayChangePerShare':
          comparison = a.dayChangePerShare - b.dayChangePerShare;
          break;
        case 'currentValue':
          comparison = a.currentValue - b.currentValue;
          break;
        case 'dayGainLoss':
          comparison = a.dayGainLoss - b.dayGainLoss;
          break;
        case 'unrealizedGainLoss':
          comparison = a.unrealizedGainLoss - b.unrealizedGainLoss;
          break;
        case 'percentOf52WkHigh':
          comparison = a.percentOf52WkHigh - b.percentOf52WkHigh;
          break;
        case 'account': {
          const accA = accountMap.get(a.accountId)?.name || '';
          const accB = accountMap.get(b.accountId)?.name || '';
          comparison = accA.localeCompare(accB);
          break;
        }
        case 'industry': {
          const indA = a.industry || a.sector || '';
          const indB = b.industry || b.sector || '';
          comparison = indA.localeCompare(indB);
          break;
        }
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredHoldings, sortField, sortDirection, accountMap]);

  const formatCurrency = (val: number, decimals: number = 2) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals }).format(val);

  const renderSortableHeader = (
    field: SortField,
    label: string,
    align: 'left' | 'right' | 'center' = 'left',
    title?: string,
    style?: React.CSSProperties
  ) => {
    const isSorted = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        className={`sortable-th ${isSorted ? 'th-sorted' : ''}`}
        title={title || `Sort by ${label}`}
        style={style}
      >
        <div className={`th-content ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
          <span>{label}</span>
          {isSorted ? (
            sortDirection === 'asc' ? (
              <ArrowUp size={12} className="sort-icon-active" />
            ) : (
              <ArrowDown size={12} className="sort-icon-active" />
            )
          ) : (
            <ArrowUpDown size={12} className="sort-icon-inactive" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="glass-panel table-panel">
      {/* Table Toolbar */}
      <div className="table-toolbar">
        {/* Category Tabs */}
        <div className="category-filter-group">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`btn-filter ${activeCategory === tab.key ? 'btn-filter-active' : ''}`}
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
              placeholder="Search ticker, name, or industry..."
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

      {/* Responsive Table Container */}
      <div className="table-scroll-container">
        <table className="data-table">
          <thead>
            <tr>
              {renderSortableHeader('symbol', 'Symbol / Asset', 'left', 'Stock or Fund Ticker')}
              {renderSortableHeader('shares', 'Shares', 'right', 'Number of shares held')}
              {renderSortableHeader('purchasePrice', 'Avg Cost', 'right', 'Purchase price per share')}
              {renderSortableHeader('costBasis', 'Cost Basis', 'right', 'Total purchase cost')}
              {renderSortableHeader('currentPrice', 'Market Price', 'right', 'Current share market price')}
              {renderSortableHeader('dayChangePerShare', 'Share Day Chg', 'right', 'Change in share price today ($ / %)')}
              {renderSortableHeader('currentValue', 'Total Value', 'right', 'Current position market value')}
              {renderSortableHeader('dayGainLoss', 'Total Day P/L', 'right', 'Total position dollar gain/loss today')}
              {renderSortableHeader('unrealizedGainLoss', 'Total P/L', 'right', 'Total unrealized gain/loss ($ / %)')}
              {renderSortableHeader('percentOf52WkHigh', '52W Range', 'center', 'Current price relative to 52-week range', { minWidth: '105px' })}
              {activeAccountId === 'ALL' && renderSortableHeader('account', 'Account', 'left', 'Account name')}
              {renderSortableHeader('industry', 'Industry / Sector', 'left', 'Economic industry and sector')}
              {renderSortableHeader('category', 'Category', 'center', 'Asset classification')}
              <th className="text-center" style={{ width: '40px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedHoldings.length === 0 ? (
              <tr>
                <td colSpan={activeAccountId === 'ALL' ? 14 : 13} className="empty-table-cell">
                  No investment holdings found matching the filter. Click "Add Position" to record a holding lot.
                </td>
              </tr>
            ) : (
              sortedHoldings.map((h) => {
                const isGain = h.unrealizedGainLoss >= 0;
                const isDayGain = h.dayGainLoss >= 0;
                const isShareDayGain = h.dayChangePerShare >= 0;
                const acc = accountMap.get(h.accountId);

                return (
                  <tr key={h.id} className="table-row-hover">
                    {/* 1. Symbol & Name */}
                    <td className="cell-symbol">
                      <div className="symbol-cell">
                        <span className="symbol-ticker">{h.symbol}</span>
                        <span className="symbol-name" title={h.name || h.symbol}>
                          {h.name || h.symbol}
                        </span>
                      </div>
                    </td>

                    {/* 2. Shares */}
                    <td className="text-right font-mono font-medium">
                      {h.shares.toLocaleString()}
                    </td>

                    {/* 3. Purchase Price */}
                    <td className="text-right font-mono text-muted">
                      {formatCurrency(h.purchasePrice)}
                      <div className="text-xs text-dim">{h.purchaseDate}</div>
                    </td>

                    {/* 4. Cost Basis */}
                    <td className="text-right font-mono font-medium">
                      {formatCurrency(h.costBasis)}
                    </td>

                    {/* 5. Today's Market Price */}
                    <td className="text-right font-mono font-bold">
                      {formatCurrency(h.currentPrice)}
                      {h.isStale && <span className="stale-dot" title="Cached Price" />}
                    </td>

                    {/* 6. Share Price Change by the Day (Per share) */}
                    <td className="text-right font-mono">
                      <div className={`font-semibold ${isShareDayGain ? 'text-success' : 'text-danger'}`}>
                        {isShareDayGain ? '+' : ''}{formatCurrency(h.dayChangePerShare)}
                      </div>
                      <div className={`text-xs ${isShareDayGain ? 'text-success' : 'text-danger'}`}>
                        {isShareDayGain ? '+' : ''}{h.dayChangePerSharePercent.toFixed(2)}%
                      </div>
                    </td>

                    {/* 7. Today's Total Value */}
                    <td className="text-right font-mono font-bold text-main">
                      {formatCurrency(h.currentValue)}
                    </td>

                    {/* 8. Day Gain / Loss (Total position dollar gain today) */}
                    <td className="text-right font-mono">
                      <div className={`font-semibold ${isDayGain ? 'text-success' : 'text-danger'}`}>
                        {isDayGain ? '+' : ''}{formatCurrency(h.dayGainLoss)}
                      </div>
                      <div className="text-xs text-dim">
                        {isDayGain ? '+' : ''}{h.dayGainLossPercent.toFixed(2)}%
                      </div>
                    </td>

                    {/* 9. Unrealized Gain / Loss */}
                    <td className="text-right font-mono">
                      <div className={`font-bold ${isGain ? 'text-success' : 'text-danger'}`}>
                        {isGain ? '+' : ''}{formatCurrency(h.unrealizedGainLoss)}
                      </div>
                      <div className={`text-xs ${isGain ? 'text-success' : 'text-danger'}`}>
                        {isGain ? '+' : ''}{h.unrealizedGainLossPercent.toFixed(2)}%
                      </div>
                    </td>

                    {/* 10. 52-Week Range Bar */}
                    <td className="cell-range-bar">
                      <RangeBar52Wk
                        currentPrice={h.currentPrice}
                        low={h.fiftyTwoWeekLow}
                        high={h.fiftyTwoWeekHigh}
                      />
                    </td>

                    {/* 11. Account Badge (if viewing all) */}
                    {activeAccountId === 'ALL' && (
                      <td className="cell-account">
                        <span className="badge-account" title={acc?.description || acc?.name}>
                          {acc?.name || 'Account'}
                        </span>
                      </td>
                    )}

                    {/* 12. Industry / Sector */}
                    <td className="cell-industry">
                      <div className="industry-cell">
                        <span className="industry-name" title={h.industry || h.sector || 'General'}>
                          {h.industry || h.sector || 'General'}
                        </span>
                        <span className="sector-tag" title={h.sector || h.category}>
                          {h.sector && h.sector.toLowerCase() !== (h.industry || '').toLowerCase() ? h.sector : h.category}
                        </span>
                      </div>
                    </td>

                    {/* 13. Category */}
                    <td className="text-center">
                      <span className={`badge-category badge-cat-${h.category.toLowerCase()}`}>
                        {h.category}
                      </span>
                    </td>

                    {/* 14. Action */}
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
