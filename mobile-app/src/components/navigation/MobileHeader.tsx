import React from 'react';
import { Lock, RefreshCw, Wifi, WifiOff, Shield } from 'lucide-react';
import { pinSecurityService } from '../../services/pinSecurityService';

interface Props {
  title: string;
  subtitle?: string;
  isBackendOnline: boolean;
  isRefreshing: boolean;
  onRefreshQuotes: () => void;
  pinEnabled: boolean;
}

export const MobileHeader: React.FC<Props> = ({
  title,
  subtitle,
  isBackendOnline,
  isRefreshing,
  onRefreshQuotes,
  pinEnabled,
}) => {
  const handleLock = () => {
    pinSecurityService.lock();
  };

  return (
    <header className="mobile-app-header">
      <div className="header-brand">
        <h1 className="header-view-title">{title}</h1>
        {subtitle && <p className="header-view-subtitle">{subtitle}</p>}
      </div>

      <div className="header-actions">
        {/* Backend Status / Refresh Button */}
        <button
          type="button"
          className={`header-status-pill ${isBackendOnline ? 'online' : 'offline'}`}
          onClick={onRefreshQuotes}
          disabled={isRefreshing}
          title={isBackendOnline ? 'Render API Online - Tap to refresh' : 'Offline / Cached quotes'}
        >
          {isRefreshing ? (
            <RefreshCw size={13} className="spin" />
          ) : isBackendOnline ? (
            <Wifi size={13} />
          ) : (
            <WifiOff size={13} />
          )}
          <span className="status-pill-text">
            {isRefreshing ? 'Syncing...' : isBackendOnline ? 'Live' : 'Cached'}
          </span>
        </button>

        {/* Lock button if PIN enabled */}
        {pinEnabled && (
          <button
            type="button"
            className="header-lock-btn"
            onClick={handleLock}
            title="Lock App"
            aria-label="Lock App"
          >
            <Lock size={16} />
          </button>
        )}
      </div>
    </header>
  );
};
