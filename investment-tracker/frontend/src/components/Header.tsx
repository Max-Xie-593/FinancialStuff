import React, { useRef } from 'react';
import {
  RefreshCw,
  TrendingUp,
  Compass,
  Sliders,
  Shield,
  AlertCircle,
  CheckCircle2,
  User as UserIcon,
  LogOut,
  Download,
  Upload,
  LogIn,
} from 'lucide-react';
import { User } from '../types/auth';

interface HeaderProps {
  activeTab: 'portfolio' | 'watchlist' | 'simulator' | 'accounts';
  setActiveTab: (tab: 'portfolio' | 'watchlist' | 'simulator' | 'accounts') => void;
  isBackendOnline: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated?: string;
  hasStaleQuotes: boolean;
  user: User | null;
  isGuest: boolean;
  onOpenAuth: () => void;
  onLogout: () => void;
  onBackup: () => void;
  onRestoreFile: (file: File) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isBackendOnline,
  isRefreshing,
  onRefresh,
  lastUpdated,
  hasStaleQuotes,
  user,
  isGuest,
  onOpenAuth,
  onLogout,
  onBackup,
  onRestoreFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Unknown';

  const handleTriggerRestore = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onRestoreFile(file);
    }
  };

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

          <div className="header-divider" />

          {/* Backup & Restore Buttons */}
          <div className="header-backup-buttons">
            <button
              onClick={onBackup}
              className="btn btn-secondary btn-sm"
              title="Export complete portfolio backup file (.json)"
            >
              <Download size={14} />
              <span>Backup</span>
            </button>
            <button
              onClick={handleTriggerRestore}
              className="btn btn-secondary btn-sm"
              title="Import and restore portfolio from a backup file (.json)"
            >
              <Upload size={14} />
              <span>Restore</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          <div className="header-divider" />

          {/* User Auth Section */}
          <div className="header-user-section">
            {user && !isGuest ? (
              <div className="user-badge" title={`Signed in as ${user.displayName || user.username}`}>
                <UserIcon size={14} className="user-icon" />
                <span className="user-name">{user.displayName || user.username}</span>
                <button onClick={onLogout} className="btn-icon-subtle" title="Sign Out">
                  <LogOut size={14} />
                </button>
              </div>
            ) : isGuest ? (
              <button
                onClick={onOpenAuth}
                className="btn btn-secondary btn-sm guest-btn"
                title="Guest Mode - Click to Sign In or Create an Account"
              >
                <UserIcon size={14} />
                <span>Guest (Sign In)</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="btn btn-primary btn-sm"
                title="Sign in to your account"
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
            )}
          </div>
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
