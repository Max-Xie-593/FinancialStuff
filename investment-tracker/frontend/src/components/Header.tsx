import React from 'react';
import { RefreshCw, TrendingUp, Compass, Sliders, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  activeTab: 'portfolio' | 'watchlist' | 'simulator' | 'accounts';
  setActiveTab: (tab: 'portfolio' | 'watchlist' | 'simulator' | 'accounts') => void;
  isBackendOnline: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated?: string;
  hasStaleQuotes: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isBackendOnline,
  isRefreshing,
  onRefresh,
  lastUpdated,
  hasStaleQuotes,
}) => {
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Unknown';

  return (
    <header className="header-container">
      <div className="header-top">
        <div className="header-brand">
          <div className="brand-icon-wrapper">
            <TrendingUp className="brand-icon" size={26} />
          </div>
          <div>
            <h1 className="brand-title">Investment Tracker</h1>
            <p className="brand-subtitle">Multi-Asset Portfolio & 52-Week Grid Strategy Simulator</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Status Indicator */}
          <div className="status-badge-container">
            {isBackendOnline ? (
              hasStaleQuotes ? (
                <div className="status-badge status-stale" title="Using cached quotes. Click Refresh for live quotes.">
                  <span className="status-dot dot-stale" />
                  <span>Data from {formattedTime} (Stale)</span>
                </div>
              ) : (
                <div className="status-badge status-live" title="Quotes are live from market data backend">
                  <CheckCircle2 size={14} className="text-success" />
                  <span>Live Quotes ({formattedTime})</span>
                </div>
              )
            ) : (
              <div className="status-badge status-offline" title="FastAPI backend is offline. Rendering persistent cached snapshot.">
                <AlertCircle size={14} className="text-danger" />
                <span>Backend Offline (Cached)</span>
              </div>
            )}
          </div>

          {/* Refresh Quotes Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`btn btn-primary ${isRefreshing ? 'btn-refreshing' : ''}`}
            title="Fetch latest stock and mutual fund quotes from Yahoo Finance"
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin-icon' : ''} />
            <span>{isRefreshing ? 'Updating Quotes...' : 'Refresh Quotes'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="header-nav">
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`nav-tab ${activeTab === 'portfolio' ? 'nav-tab-active' : ''}`}
        >
          <TrendingUp size={18} />
          <span>Holdings & Portfolio</span>
        </button>

        <button
          onClick={() => setActiveTab('watchlist')}
          className={`nav-tab ${activeTab === 'watchlist' ? 'nav-tab-active' : ''}`}
        >
          <Compass size={18} />
          <span>52-Week High Watchlist</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`nav-tab ${activeTab === 'simulator' ? 'nav-tab-active' : ''}`}
        >
          <Sliders size={18} />
          <span>Return Estimation Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`nav-tab ${activeTab === 'accounts' ? 'nav-tab-active' : ''}`}
        >
          <Shield size={18} />
          <span>Accounts & Lots</span>
        </button>
      </nav>
    </header>
  );
};
