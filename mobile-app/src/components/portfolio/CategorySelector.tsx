import React from 'react';
import { AssetCategory } from '../../types/investment';
import { LucideIcon, Layers, TrendingUp, DollarSign, Shield, PieChart, Briefcase } from 'lucide-react';

export interface CategoryStat {
  count: number;
  value: number;
}

interface CategorySelectorProps {
  selectedCategory: 'ALL' | AssetCategory;
  onSelectCategory: (category: 'ALL' | AssetCategory) => void;
  categoryStats: Record<AssetCategory | 'ALL', CategoryStat>;
}

const CATEGORIES: {
  key: 'ALL' | AssetCategory;
  label: string;
  icon: LucideIcon;
  colorClass: string;
  dotColor: string;
}[] = [
  { key: 'ALL', label: 'All Assets', icon: Layers, colorClass: 'cat-all', dotColor: '#93c5fd' },
  { key: 'Stock', label: 'Stocks', icon: TrendingUp, colorClass: 'cat-stock', dotColor: '#3b82f6' },
  { key: 'Dividend', label: 'High Dividend', icon: DollarSign, colorClass: 'cat-dividend', dotColor: '#10b981' },
  { key: 'Berkshire', label: 'Berkshire', icon: Shield, colorClass: 'cat-berkshire', dotColor: '#8b5cf6' },
  { key: 'ETF', label: 'ETFs', icon: PieChart, colorClass: 'cat-etf', dotColor: '#06b6d4' },
  { key: 'MutualFund', label: 'Mutual Funds', icon: Briefcase, colorClass: 'cat-mutualfund', dotColor: '#f59e0b' },
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryStats,
}) => {
  const formatCompactValue = (val: number) => {
    if (val >= 1_000_000) {
      return `$${(val / 1_000_000).toFixed(2)}M`;
    }
    if (val >= 1_000) {
      return `$${(val / 1_000).toFixed(1)}k`;
    }
    return `$${val.toFixed(0)}`;
  };

  return (
    <div className="category-selector-container">
      <div className="category-selector-header">
        <span className="category-selector-label">Filter Asset Subsets:</span>
      </div>
      <div className="category-pills-list">
        {CATEGORIES.map((cat) => {
          const stats = categoryStats[cat.key] || { count: 0, value: 0 };
          const isActive = selectedCategory === cat.key;
          const Icon = cat.icon;

          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelectCategory(cat.key)}
              className={`category-pill ${cat.colorClass} ${isActive ? 'category-pill-active' : ''}`}
              title={`${cat.label} • ${stats.count} position(s) • ${formatCompactValue(stats.value)}`}
            >
              <span className="category-dot" style={{ backgroundColor: cat.dotColor }} />
              <Icon size={14} className="category-pill-icon" />
              <span className="category-pill-label">{cat.label}</span>
              <span className="pill-count">{stats.count}</span>
              {stats.value > 0 && (
                <span className="category-pill-value">{formatCompactValue(stats.value)}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
