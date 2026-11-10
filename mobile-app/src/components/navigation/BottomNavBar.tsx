import React from 'react';
import { TrendingUp, Briefcase, Target, Settings, AlertCircle } from 'lucide-react';

export type TabId = 'planner' | 'portfolio' | 'grid' | 'settings';

interface Props {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
  watchlistTriggerCount?: number;
  isBackendOffline?: boolean;
}

export const BottomNavBar: React.FC<Props> = ({
  activeTab,
  onChangeTab,
  watchlistTriggerCount = 0,
  isBackendOffline = false,
}) => {
  return (
    <nav className="mobile-bottom-nav">
      <button
        type="button"
        className={`nav-item ${activeTab === 'planner' ? 'active' : ''}`}
        onClick={() => onChangeTab('planner')}
        aria-label="Lifetime Wealth Planner"
      >
        <div className="nav-icon-wrap">
          <TrendingUp size={22} />
        </div>
        <span className="nav-label">Planner</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activeTab === 'portfolio' ? 'active' : ''}`}
        onClick={() => onChangeTab('portfolio')}
        aria-label="Investment Portfolio Tracker"
      >
        <div className="nav-icon-wrap">
          <Briefcase size={22} />
          {isBackendOffline && <span className="nav-badge-dot warning" />}
        </div>
        <span className="nav-label">Portfolio</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activeTab === 'grid' ? 'active' : ''}`}
        onClick={() => onChangeTab('grid')}
        aria-label="52-Week High & Grid Strategy"
      >
        <div className="nav-icon-wrap">
          <Target size={22} />
          {watchlistTriggerCount > 0 && (
            <span className="nav-badge-count">{watchlistTriggerCount}</span>
          )}
        </div>
        <span className="nav-label">Grid Sim</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => onChangeTab('settings')}
        aria-label="Settings & Security"
      >
        <div className="nav-icon-wrap">
          <Settings size={22} />
        </div>
        <span className="nav-label">Settings</span>
      </button>
    </nav>
  );
};
