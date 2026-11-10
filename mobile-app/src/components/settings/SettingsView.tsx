import React, { useState, useRef } from 'react';
import {
  Terminal,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Server,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  DollarSign,
  TrendingUp,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { pinSecurityService, AutoLockTimeout } from '../../services/pinSecurityService';
import { checkBackendHealth, setCustomApiUrl, getApiBaseUrl } from '../../services/marketApi';
import { Account, HoldingLot, MarketQuote, WatchlistStock, GridSimInputs } from '../../types/investment';
import { FinancialInputs } from '../../engine/financeEngine';
import { bridgePortfolioToPlanner, PortfolioBalanceBridge } from '../../services/bridgeService';
import { exportFullPortfolioBackup, parseAndValidatePortfolioBackup, PortfolioBackupSchema } from '../../utils/scenarioIO';
import { storageService } from '../../services/storageService';

interface Props {
  accounts: Account[];
  holdings: HoldingLot[];
  quotes: Record<string, MarketQuote>;
  watchlist?: WatchlistStock[];
  gridInputs?: GridSimInputs;
  plannerInputs: FinancialInputs;
  onUpdatePlannerInputs: (inputs: FinancialInputs) => void;
  onOpenAuthModal: () => void;
  username?: string;
  isLoggedIn: boolean;
  isBackendOnline: boolean;
  onRefreshQuotes: () => void;
  onReloadPortfolioData?: () => void;
  onRestoreBackup?: (backup: PortfolioBackupSchema) => void;
}

export const SettingsView: React.FC<Props> = ({
  accounts,
  holdings,
  quotes,
  watchlist,
  gridInputs,
  plannerInputs,
  onUpdatePlannerInputs,
  onOpenAuthModal,
  username,
  isLoggedIn,
  isBackendOnline,
  onRefreshQuotes,
  onRestoreBackup,
}) => {
  // PIN State
  const [pinEnabled, setPinEnabled] = useState(pinSecurityService.isPinEnabled());
  const [autoLockTimeout, setAutoLockTimeout] = useState<AutoLockTimeout>(
    pinSecurityService.getAutoLockTimeout()
  );
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // Sync Bridge Toast
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Backend URL config & test state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [apiUrl, setApiUrl] = useState(() => {
    return localStorage.getItem('it_custom_api_url') || '';
  });
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestStatus('Pinging backend...');
    try {
      const online = await checkBackendHealth();
      if (online) {
        setTestStatus('Connected successfully! (HTTP 200 OK)');
        onRefreshQuotes();
      } else {
        setTestStatus('Could not connect. Check if backend is running on port 8000.');
      }
    } catch (e: any) {
      setTestStatus(`Error: ${e.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveApiUrl = () => {
    setCustomApiUrl(apiUrl);
    setTestStatus('Backend URL updated.');
    handleTestConnection();
  };

  // Compute current bridge preview
  const bridgePreview: PortfolioBalanceBridge = React.useMemo(() => {
    const { syncedAmounts } = bridgePortfolioToPlanner(
      plannerInputs,
      accounts,
      holdings,
      quotes
    );
    return syncedAmounts;
  }, [plannerInputs, accounts, holdings, quotes]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  // Handle PIN Save
  const handleSavePin = () => {
    if (newPin.length < 4 || newPin.length > 6) {
      setPinError('PIN must be 4 to 6 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    try {
      pinSecurityService.setPin(newPin);
      setPinEnabled(true);
      setShowPinSetup(false);
      setNewPin('');
      setConfirmPin('');
      setPinError('');
      setPinSuccess('PIN security enabled successfully!');
      setTimeout(() => setPinSuccess(''), 4000);
    } catch (e: any) {
      setPinError(e.message || 'Failed to save PIN');
    }
  };

  const handleDisablePin = () => {
    const entered = window.prompt('Enter your current PIN to disable security lock:');
    if (!entered) return;
    if (pinSecurityService.disablePin(entered)) {
      setPinEnabled(false);
      setPinSuccess('PIN lock removed');
      setTimeout(() => setPinSuccess(''), 4000);
    } else {
      alert('Incorrect PIN');
    }
  };

  const handleTimeoutChange = (val: AutoLockTimeout) => {
    setAutoLockTimeout(val);
    pinSecurityService.setAutoLockTimeout(val);
  };

  // One-click apply balances to planner
  const handleApplyBalancesToPlanner = () => {
    const { updatedInputs, syncedAmounts } = bridgePortfolioToPlanner(
      plannerInputs,
      accounts,
      holdings,
      quotes
    );
    onUpdatePlannerInputs(updatedInputs);
    setSyncToast(
      `Synced ${formatCurrency(syncedAmounts.grandTotal)} across Taxable, Roth & 401(k) accounts into your Lifetime Planner!`
    );
    setTimeout(() => setSyncToast(null), 5000);
  };

    // Backup Export
  const handleExportBackup = () => {
    exportFullPortfolioBackup({
      accounts,
      holdings,
      watchlist: watchlist || [],
      gridInputs: gridInputs || ({} as any),
    });
  };

  // Backup Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseAndValidatePortfolioBackup(file);
      if (parsed) {
        if (onRestoreBackup) {
          onRestoreBackup(parsed);
        } else {
          storageService.saveAccounts(parsed.accounts);
          storageService.saveHoldings(parsed.holdings);
          storageService.saveWatchlist(parsed.watchlist);
          storageService.saveGridInputs(parsed.gridInputs);
          if (parsed.activeAccountId) {
            storageService.setActiveAccountId(parsed.activeAccountId);
          }
        }
        setSyncToast(`Portfolio restored: ${parsed.holdings.length} holdings loaded!`);
        setTimeout(() => setSyncToast(null), 4000);
      }
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="settings-view-container">
      {/* Toast */}
      {syncToast && (
        <div className="sync-toast-banner">
          <Sparkles size={16} />
          <span>{syncToast}</span>
        </div>
      )}
      {pinSuccess && (
        <div className="sync-toast-banner" style={{ background: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981' }}>
          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
          <span>{pinSuccess}</span>
        </div>
      )}

      {/* Card 1: Direct Portfolio -> Planner Link */}
      <section className="glass-panel settings-card highlight-card">
        <div className="settings-card-header">
          <div className="settings-icon-badge primary">
            <TrendingUp size={20} />
          </div>
          <div>
            <h2 className="settings-card-title">Portfolio & Planner Synergy</h2>
            <p className="settings-card-subtitle">
              Feed your real tracked accounts directly into the 60-Year Retirement Engine
            </p>
          </div>
        </div>

        <div className="bridge-breakdown-grid">
          <div className="bridge-stat-box">
            <span className="bridge-label">Taxable Investments</span>
            <span className="bridge-val">{formatCurrency(bridgePreview.taxableTotal)}</span>
          </div>
          <div className="bridge-stat-box">
            <span className="bridge-label">Roth IRA Assets</span>
            <span className="bridge-val">{formatCurrency(bridgePreview.rothTotal)}</span>
          </div>
          <div className="bridge-stat-box">
            <span className="bridge-label">401(k) / Trad IRA</span>
            <span className="bridge-val">{formatCurrency(bridgePreview.tradIraOr401kTotal)}</span>
          </div>
          <div className="bridge-stat-box total">
            <span className="bridge-label">Total Liquid Capital</span>
            <span className="bridge-val">{formatCurrency(bridgePreview.grandTotal)}</span>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary-action"
          onClick={handleApplyBalancesToPlanner}
        >
          <Sparkles size={16} />
          <span>Apply Actual Balances to Lifetime Planner</span>
        </button>
      </section>

      {/* Card 2: In-App PIN Security */}
      <section className="glass-panel settings-card">
        <div className="settings-card-header">
          <div className="settings-icon-badge security">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="settings-card-title">App Security & PIN Lock</h2>
            <p className="settings-card-subtitle">
              Encrypt your local dashboard with a secure numeric passcode
            </p>
          </div>
        </div>

        <div className="settings-toggle-row">
          <div className="toggle-info">
            <span className="toggle-title">PIN Code Protection</span>
            <span className="toggle-desc">
              {pinEnabled ? 'App is secured with a numeric PIN' : 'Security lock is currently off'}
            </span>
          </div>
          {pinEnabled ? (
            <button
              type="button"
              className="btn-danger-outline"
              onClick={handleDisablePin}
            >
              Disable PIN
            </button>
          ) : (
            <button
              type="button"
              className="btn-accent-sm"
              onClick={() => setShowPinSetup(true)}
            >
              Set PIN
            </button>
          )}
        </div>

        {/* PIN Setup Form */}
        {showPinSetup && (
          <div className="pin-setup-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Lock size={15} color="var(--accent-primary)" />
              <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>
                Create 4 to 6 Digit PIN
              </h4>
            </div>
            <p className="text-xs text-muted" style={{ marginBottom: '12px', lineHeight: 1.4 }}>
              Enter numbers only. This passcode will be required whenever reopening the app.
            </p>
            {pinError && <p className="text-danger text-xs mb-2" style={{ fontWeight: 600 }}>{pinError}</p>}
            <div className="pin-inputs-row">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="New PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                className="pin-text-field"
              />
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                className="pin-text-field"
              />
            </div>
            <div className="pin-setup-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowPinSetup(false);
                  setNewPin('');
                  setConfirmPin('');
                  setPinError('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSavePin}
              >
                Save PIN
              </button>
            </div>
          </div>
        )}

        {pinEnabled && (
          <div className="settings-field-group">
            <label className="field-label">Auto-Lock Inactivity Timer</label>
            <select
              className="settings-select"
              value={autoLockTimeout}
              onChange={(e) => handleTimeoutChange(Number(e.target.value) as AutoLockTimeout)}
            >
              <option value={0}>Immediately when app is closed / minimized</option>
              <option value={1}>After 1 minute of inactivity</option>
              <option value={5}>After 5 minutes of inactivity (Recommended)</option>
              <option value={15}>After 15 minutes of inactivity</option>
              <option value={30}>After 30 minutes of inactivity</option>
            </select>
          </div>
        )}

        {pinEnabled && (
          <button
            type="button"
            className="btn-secondary-full"
            style={{ marginTop: '12px' }}
            onClick={() => pinSecurityService.lock()}
          >
            <Lock size={15} /> Lock App Now
          </button>
        )}
      </section>

      {/* Card 3: Cloud & Render Market Service */}
      <section className="glass-panel settings-card">
        <div className="settings-card-header">
          <div className="settings-icon-badge cloud">
            <Server size={20} />
          </div>
          <div>
            <h2 className="settings-card-title">Market Quotes & Cloud Sync</h2>
            <p className="settings-card-subtitle">
              FastAPI backend running Yahoo Finance & multi-device sync
            </p>
          </div>
        </div>

        <div className="backend-status-card">
          <div className="status-indicator-group">
            <span className={`status-dot ${isBackendOnline ? 'online' : 'offline'}`} />
            <div>
              <span className="status-name">
                {isBackendOnline ? 'Backend Online (Live Quotes)' : 'Backend Offline (Using Cached Quotes)'}
              </span>
              <p className="text-xs text-dim">
                {isBackendOnline
                  ? 'Real-time Yahoo Finance quote sync active'
                  : 'Start backend on port 8000 or enter Render URL below'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-refresh-quotes"
            onClick={onRefreshQuotes}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Backend Endpoint Configuration */}
        <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
          <label className="field-label" style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
            Backend API Endpoint
          </label>
          <p className="text-xs text-dim" style={{ marginBottom: '8px' }}>
            Active endpoint: <code style={{ color: 'var(--accent-cyan)' }}>{getApiBaseUrl()}</code>
            {(import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL) && (
              <span style={{ color: 'var(--accent-success)', marginLeft: '6px' }}>
                (Permanently configured in Vercel)
              </span>
            )}
          </p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              placeholder={getApiBaseUrl()}
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="form-input"
              style={{ fontSize: '13px' }}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSaveApiUrl}
              disabled={testingConnection}
              style={{ whiteSpace: 'nowrap' }}
            >
              Save & Test
            </button>
          </div>

          {testStatus && (
            <p className="text-xs" style={{ color: testStatus.startsWith('Connected') ? 'var(--accent-success)' : 'var(--accent-warning)', fontWeight: 600 }}>
              {testStatus}
            </p>
          )}

          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-xs text-muted" style={{ display: 'block', lineHeight: 1.4 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Terminal size={15} color="var(--accent-cyan)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-main)' }}>Local Dev Instructions:</strong><br />
                  <code>cd investment-tracker/backend</code><br />
                  <code>python main.py</code> (runs on port 8000)
                </div>
              </div>
            </span>
          </div>
        </div>

        {/* Cloud Auth Status */}
        <div className="settings-toggle-row" style={{ marginTop: '14px' }}>
          <div className="toggle-info">
            <span className="toggle-title">Cloud Account</span>
            <span className="toggle-desc">
              {isLoggedIn
                ? `Logged in as @${username}`
                : 'Guest mode (portfolio saved in local browser storage)'}
            </span>
          </div>
          <button
            type="button"
            className="btn-accent-sm"
            onClick={onOpenAuthModal}
          >
            {isLoggedIn ? 'Account' : 'Sign In / Register'}
          </button>
        </div>
      </section>

      {/* Card 4: Backup & Restore */}
      <section className="glass-panel settings-card">
        <div className="settings-card-header">
          <div className="settings-icon-badge file">
            <Smartphone size={20} />
          </div>
          <div>
            <h2 className="settings-card-title">Data Backup & PWA Status</h2>
            <p className="settings-card-subtitle">
              Export portable JSON scenarios or install as a home screen app
            </p>
          </div>
        </div>

        <div className="pwa-install-tip">
          <span className="text-xs text-muted">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Smartphone size={15} color="var(--accent-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-main)' }}>iPhone Tip:</strong> In Safari, tap the <strong>Share</strong> button and choose <strong>"Add to Home Screen"</strong> for a permanent, standalone fullscreen app experience.
                </div>
              </div>
          </span>
        </div>

        <div className="backup-btn-grid" style={{ marginTop: '14px' }}>
          <button
            type="button"
            className="backup-action-card"
            onClick={handleExportBackup}
          >
            <div className="backup-action-icon primary">
              <Download size={18} />
            </div>
            <div className="backup-action-text">
              <span className="backup-action-title">Export Backup</span>
              <span className="backup-action-sub">Download JSON scenario</span>
            </div>
          </button>

          <button
            type="button"
            className="backup-action-card"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="backup-action-icon success">
              <Upload size={18} />
            </div>
            <div className="backup-action-text">
              <span className="backup-action-title">Import Backup</span>
              <span className="backup-action-sub">Restore from JSON file</span>
            </div>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json"
            onChange={handleFileChange}
          />
        </div>
      </section>
    </div>
  );
};
