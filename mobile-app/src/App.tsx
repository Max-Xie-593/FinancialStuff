import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Account,
  HoldingLot,
  MarketQuote,
  WatchlistStock,
  GridSimInputs,
  AssetCategory,
} from './types/investment';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { AuthSession } from './types/auth';
import { fetchMarketQuotes, checkBackendHealth } from './services/marketApi';
import { calculateHoldingMetrics, aggregatePortfolio } from './engine/portfolioEngine';
import { DEFAULT_INPUTS, FinancialInputs, runFinanceProjection } from './engine/financeEngine';
import { pinSecurityService } from './services/pinSecurityService';
import { PortfolioBackupSchema } from './utils/scenarioIO';

// Navigation & Security Components
import { BottomNavBar, TabId } from './components/navigation/BottomNavBar';
import { MobileHeader } from './components/navigation/MobileHeader';
import { PinLockScreen } from './components/security/PinLockScreen';

// Planner Components
import { ProjectionChart } from './components/planner/ProjectionChart';
import { YearlyLedger } from './components/planner/YearlyLedger';
import { BudgetEnvelope } from './components/planner/BudgetEnvelope';
import { ScenarioControls } from './components/planner/ScenarioControls';

// Portfolio Components
import { AccountSelector } from './components/portfolio/AccountSelector';
import { CategorySelector } from './components/portfolio/CategorySelector';
import { PortfolioSummaryCards } from './components/portfolio/PortfolioSummaryCards';
import { HoldingsView } from './components/portfolio/HoldingsView';
import { AddHoldingModal } from './components/portfolio/AddHoldingModal';
import { AccountsManager } from './components/portfolio/AccountsManager';
import { AuthModal } from './components/portfolio/AuthModal';

// Grid Components
import { Watchlist52Wk } from './components/grid/Watchlist52Wk';
import { GridSimulator } from './components/grid/GridSimulator';

// Settings Component
import { SettingsView } from './components/settings/SettingsView';

import { TrendingUp, BarChart3, Wallet, Sliders, ShieldCheck, X } from 'lucide-react';

export const App: React.FC = () => {
  // 1. Security & Lock State
  const [isLocked, setIsLocked] = useState<boolean>(() => pinSecurityService.getIsLocked());
  const [pinEnabled, setPinEnabled] = useState<boolean>(() => pinSecurityService.isPinEnabled());

  useEffect(() => {
    const unsub = pinSecurityService.subscribe((locked) => {
      setIsLocked(locked);
      setPinEnabled(pinSecurityService.isPinEnabled());
    });
    return unsub;
  }, []);

  // 2. Storage Persistence & PWA Registration
  useEffect(() => {
    if (typeof window !== 'undefined' && 'storage' in navigator && 'persist' in navigator.storage) {
      navigator.storage.persist().then((persisted) => {
        if (persisted) {
          console.log('✅ Storage persistence granted by browser.');
        }
      });
    }

    if (!import.meta.env.DEV && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        reg.update();
      }).catch((err) => {
        console.warn('SW registration info:', err);
      });
    }
  }, []);

  // 3. Navigation State
  const [activeTab, setActiveTab] = useState<TabId>('portfolio');
  const [plannerSubTab, setPlannerSubTab] = useState<'chart' | 'ledger' | 'budget' | 'controls'>('chart');
  const [gridSubTab, setGridSubTab] = useState<'watchlist' | 'simulator'>('watchlist');

  // 4. Auth & User Scoped Portfolio State
  const [session, setSession] = useState<AuthSession | null>(() => authService.getSession());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>(() => storageService.getAccounts(session?.user?.id));
  const [activeAccountId, setActiveAccountId] = useState<string>(() => storageService.getActiveAccountId(session?.user?.id));
  const [holdings, setHoldings] = useState<HoldingLot[]>(() => storageService.getHoldings(session?.user?.id));
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>(() => storageService.getWatchlist(session?.user?.id));
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>(() => storageService.getCachedQuotes());
  const [gridInputs, setGridInputs] = useState<GridSimInputs>(() => storageService.getGridInputs(session?.user?.id));

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | AssetCategory>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 5. Planner Inputs & Engine
  const [plannerInputs, setPlannerInputs] = useState<FinancialInputs>(() => {
    const saved = localStorage.getItem('pfp_user_inputs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_INPUTS;
      }
    }
    return DEFAULT_INPUTS;
  });

  const handlePlannerInputChange = (updated: FinancialInputs) => {
    setPlannerInputs(updated);
    localStorage.setItem('pfp_user_inputs', JSON.stringify(updated));
  };

  const handleResetPlanner = () => {
    setPlannerInputs(DEFAULT_INPUTS);
    localStorage.removeItem('pfp_user_inputs');
  };

  const projections = useMemo(() => {
    return runFinanceProjection(plannerInputs);
  }, [plannerInputs]);

  // Sync to cloud helper
  const syncToCloud = useCallback(
    (accs: Account[], hlds: HoldingLot[], wl: WatchlistStock[], grid: GridSimInputs) => {
      if (session && !session.isGuest && session.user?.id) {
        storageService.syncWithBackend(session.user.id, {
          accounts: accs,
          holdings: hlds,
          watchlist: wl,
          gridInputs: grid,
        });
      }
    },
    [session]
  );

  // Derive symbols
  const allSymbols = useMemo(() => {
    const syms = new Set<string>();
    holdings.forEach((h) => syms.add(h.symbol.toUpperCase()));
    watchlist.forEach((w) => syms.add(w.symbol.toUpperCase()));
    return Array.from(syms);
  }, [holdings, watchlist]);

  // Quote refresh
  const refreshQuotes = useCallback(
    async (force: boolean = false) => {
      setIsRefreshing(true);
      try {
        const result = await fetchMarketQuotes(allSymbols, force);
        setQuotes(result.quotes);
        setIsBackendOnline(result.isBackendOnline);
      } catch (e) {
        console.error('Failed to sync quotes:', e);
        setIsBackendOnline(false);
      } finally {
        setIsRefreshing(false);
      }
    },
    [allSymbols]
  );

  useEffect(() => {
    const init = async () => {
      const online = await checkBackendHealth();
      setIsBackendOnline(online);
      if (online) {
        refreshQuotes(false);
      }
    };
    init();
  }, [refreshQuotes]);

  // Calculated Holdings for Active Account
  const accountHoldings = useMemo(() => {
    return holdings
      .filter((h) => activeAccountId === 'ALL' || h.accountId === activeAccountId)
      .map((h) => calculateHoldingMetrics(h, quotes));
  }, [holdings, activeAccountId, quotes]);

  const activeAccount = useMemo(() => {
    if (activeAccountId === 'ALL') return null;
    return accounts.find((a) => a.id === activeAccountId) || null;
  }, [accounts, activeAccountId]);

  // Total summary for active account
  const overallAccountSummary = useMemo(() => {
    return aggregatePortfolio(accountHoldings);
  }, [accountHoldings]);

  // Category statistics within the active account
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; value: number }> = {
      ALL: { count: accountHoldings.length, value: overallAccountSummary.totalCurrentValue },
      Stock: { count: 0, value: 0 },
      Dividend: { count: 0, value: 0 },
      Berkshire: { count: 0, value: 0 },
      ETF: { count: 0, value: 0 },
      MutualFund: { count: 0, value: 0 },
    };
    accountHoldings.forEach((h) => {
      if (stats[h.category]) {
        stats[h.category].count += 1;
        stats[h.category].value += h.currentValue;
      }
    });
    return stats;
  }, [accountHoldings, overallAccountSummary]);

  // Holdings filtered by BOTH active account AND selected category
  const filteredCategoryHoldings = useMemo(() => {
    if (selectedCategory === 'ALL') return accountHoldings;
    return accountHoldings.filter((h) => h.category === selectedCategory);
  }, [accountHoldings, selectedCategory]);

  // Portfolio summary for the selected category subset
  const categorySummary = useMemo(() => {
    if (selectedCategory === 'ALL') return overallAccountSummary;
    return aggregatePortfolio(filteredCategoryHoldings);
  }, [selectedCategory, overallAccountSummary, filteredCategoryHoldings]);

  // Backward compatibility alias
  const calculatedHoldings = accountHoldings;
  const portfolioSummary = categorySummary;

  // Position count by account
  const positionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    holdings.forEach((h) => {
      counts[h.accountId] = (counts[h.accountId] || 0) + 1;
    });
    return counts;
  }, [holdings]);

  // Watchlist Buy Triggers
  const watchlistTriggerCount = useMemo(() => {
    let count = 0;
    watchlist.forEach((stock) => {
      const quote = quotes[stock.symbol.toUpperCase()];
      if (quote && quote.fiftyTwoWeekHigh && quote.fiftyTwoWeekHigh > 0) {
        const buyPrice = quote.fiftyTwoWeekHigh * stock.targetBuyPctOfHigh;
        if (quote.price <= buyPrice) {
          count++;
        }
      }
    });
    return count;
  }, [watchlist, quotes]);

  // Actions: Add holding
  const handleAddHolding = (lot: HoldingLot) => {
    const updated = [...holdings, lot];
    setHoldings(updated);
    storageService.saveHoldings(updated, session?.user?.id);
    syncToCloud(accounts, updated, watchlist, gridInputs);
    setIsAddModalOpen(false);
    refreshQuotes(true);
  };

  // Actions: Delete holding
  const handleDeleteHolding = (id: string) => {
    const updated = holdings.filter((h) => h.id !== id);
    setHoldings(updated);
    storageService.saveHoldings(updated, session?.user?.id);
    syncToCloud(accounts, updated, watchlist, gridInputs);
  };

  // Account change
  const handleSelectAccount = (id: string) => {
    setActiveAccountId(id);
    storageService.setActiveAccountId(id, session?.user?.id);
  };

  // Restore backup handler
  const handleRestoreBackup = (data: PortfolioBackupSchema) => {
    const uid = session?.user?.id;
    setAccounts(data.accounts);
    setHoldings(data.holdings);
    setWatchlist(data.watchlist);
    setGridInputs(data.gridInputs);
    setActiveAccountId(data.activeAccountId || 'ALL');

    storageService.saveAccounts(data.accounts, uid);
    storageService.saveHoldings(data.holdings, uid);
    storageService.saveWatchlist(data.watchlist, uid);
    storageService.saveGridInputs(data.gridInputs, uid);
    storageService.setActiveAccountId(data.activeAccountId || 'ALL', uid);

    syncToCloud(data.accounts, data.holdings, data.watchlist, data.gridInputs);
  };

  const handleUpdateAccounts = (updated: Account[]) => {
    setAccounts(updated);
    storageService.saveAccounts(updated, session?.user?.id);
    syncToCloud(updated, holdings, watchlist, gridInputs);
  };

  // Format currency
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  // View Titles
  const viewTitles: Record<TabId, { title: string; subtitle: string }> = {
    planner: {
      title: 'Wealth Planner',
      subtitle: '60-Year Retirement Projection & Taxes',
    },
    portfolio: {
      title: 'Investment Portfolio',
      subtitle: activeAccount ? activeAccount.name : 'All Accounts Consolidated',
    },
    grid: {
      title: 'Strategy & Grid Sim',
      subtitle: '52-Week High Watchlist & Systematic DCA',
    },
    settings: {
      title: 'Settings & Security',
      subtitle: 'PIN Passcode, Render Cloud & Synergy',
    },
  };

  // IF LOCKED, render PinLockScreen
  if (isLocked) {
    return <PinLockScreen onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className="mobile-app-root">
      {/* Top Header */}
      <MobileHeader
        title={viewTitles[activeTab].title}
        subtitle={viewTitles[activeTab].subtitle}
        isBackendOnline={isBackendOnline}
        isRefreshing={isRefreshing}
        onRefreshQuotes={() => refreshQuotes(true)}
        pinEnabled={pinEnabled}
      />

      {/* Main Content Area */}
      <main className="mobile-app-content">
        {/* ==================== TAB 1: WEALTH PLANNER ==================== */}
        {activeTab === 'planner' && (
          <div className="tab-pane-container">
            {/* Quick Metrics Bar */}
            <div className="metrics-grid" style={{ marginBottom: '14px' }}>
              <div className="glass-panel metric-card">
                <span className="metric-label">Current Net Worth (Age {plannerInputs.startAge})</span>
                <span className="metric-value" style={{ color: 'var(--accent-cyan)' }}>
                  {formatCurrency(
                    plannerInputs.initCash +
                      plannerInputs.initGrowthInv +
                      plannerInputs.initBalanceInv +
                      plannerInputs.init401k +
                      plannerInputs.initRoth +
                      plannerInputs.initEdu +
                      plannerInputs.initProperty
                  )}
                </span>
                <span className="metric-change positive">
                  <ShieldCheck size={12} /> Starting Capital Basis
                </span>
              </div>

              <div className="glass-panel metric-card">
                <span className="metric-label">Retirement Target (Age {plannerInputs.retirementAge})</span>
                <span className="metric-value" style={{ color: 'var(--accent-primary)' }}>
                  {formatCurrency(
                    projections.find((p) => p.age === plannerInputs.retirementAge)?.totalAssets || 0
                  )}
                </span>
                <span className="metric-change positive">Threshold Target</span>
              </div>
            </div>

            {/* Sub-nav tabs for Planner */}
            <div className="planner-subnav">
              <button
                type="button"
                className={`subnav-pill ${plannerSubTab === 'chart' ? 'active' : ''}`}
                onClick={() => setPlannerSubTab('chart')}
              >
                <TrendingUp size={14} /> Trajectory
              </button>
              <button
                type="button"
                className={`subnav-pill ${plannerSubTab === 'controls' ? 'active' : ''}`}
                onClick={() => setPlannerSubTab('controls')}
              >
                <Sliders size={14} /> Scenario Inputs
              </button>
              <button
                type="button"
                className={`subnav-pill ${plannerSubTab === 'ledger' ? 'active' : ''}`}
                onClick={() => setPlannerSubTab('ledger')}
              >
                <BarChart3 size={14} /> Ledger
              </button>
              <button
                type="button"
                className={`subnav-pill ${plannerSubTab === 'budget' ? 'active' : ''}`}
                onClick={() => setPlannerSubTab('budget')}
              >
                <Wallet size={14} /> Envelopes
              </button>
            </div>

            {/* Sub-views */}
            {plannerSubTab === 'chart' && (
              <ProjectionChart
                projections={projections}
                retirementAge={plannerInputs.retirementAge}
              />
            )}

            {plannerSubTab === 'controls' && (
              <ScenarioControls
                inputs={plannerInputs}
                onChange={handlePlannerInputChange}
                onReset={handleResetPlanner}
              />
            )}

            {plannerSubTab === 'ledger' && (
              <YearlyLedger projections={projections} />
            )}

            {plannerSubTab === 'budget' && (
              <BudgetEnvelope
                inputs={plannerInputs}
                onChange={handlePlannerInputChange}
              />
            )}
          </div>
        )}

        {/* ==================== TAB 2: PORTFOLIO TRACKER ==================== */}
        {activeTab === 'portfolio' && (
          <div className="tab-pane-container">
            {/* Account Selector */}
            <AccountSelector
              accounts={accounts}
              activeAccountId={activeAccountId}
              onSelectAccount={handleSelectAccount}
              onAddAccountClick={() => setIsAccountsModalOpen(true)}
              positionCountByAccount={positionCounts}
            />

            {/* Asset Category / Subset Switcher Bar */}
            <CategorySelector
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categoryStats={categoryStats as any}
            />

            {/* Summary Metric Cards */}
            <PortfolioSummaryCards
              summary={categorySummary}
              overallTotalValue={overallAccountSummary.totalCurrentValue}
              selectedCategory={selectedCategory}
            />

            {/* Holdings View (Cards / Table) */}
            <HoldingsView
              holdings={accountHoldings}
              accounts={accounts}
              onAddPositionClick={() => setIsAddModalOpen(true)}
              onDeletePosition={handleDeleteHolding}
              activeAccountId={activeAccountId}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>
        )}

        {/* ==================== TAB 3: GRID SIMULATOR & WATCHLIST ==================== */}
        {activeTab === 'grid' && (
          <div className="tab-pane-container">
            {/* Sub-nav for Strategy */}
            <div className="planner-subnav" style={{ marginBottom: '14px' }}>
              <button
                type="button"
                className={`subnav-pill ${gridSubTab === 'watchlist' ? 'active' : ''}`}
                onClick={() => setGridSubTab('watchlist')}
              >
                52-Wk High Watchlist ({watchlist.length})
                {watchlistTriggerCount > 0 && (
                  <span className="badge-pill alert">{watchlistTriggerCount} Buy</span>
                )}
              </button>
              <button
                type="button"
                className={`subnav-pill ${gridSubTab === 'simulator' ? 'active' : ''}`}
                onClick={() => setGridSubTab('simulator')}
              >
                DCA Grid Simulator
              </button>
            </div>

            {gridSubTab === 'watchlist' && (
              <Watchlist52Wk
                watchlist={watchlist}
                quotes={quotes}
                onAddStock={(stock) => {
                  const updated = [...watchlist, stock];
                  setWatchlist(updated);
                  storageService.saveWatchlist(updated, session?.user?.id);
                  syncToCloud(accounts, holdings, updated, gridInputs);
                  refreshQuotes(true);
                }}
                onRemoveStock={(symbol: string) => {
                  const updated = watchlist.filter((w) => w.symbol !== symbol);
                  setWatchlist(updated);
                  storageService.saveWatchlist(updated, session?.user?.id);
                  syncToCloud(accounts, holdings, updated, gridInputs);
                }}
                onUpdateTargetPct={(symbol: string, newTarget: number) => {
                  const updated = watchlist.map((w) =>
                    w.symbol === symbol ? { ...w, targetBuyPctOfHigh: newTarget } : w
                  );
                  setWatchlist(updated);
                  storageService.saveWatchlist(updated, session?.user?.id);
                  syncToCloud(accounts, holdings, updated, gridInputs);
                }}
              />
            )}

            {gridSubTab === 'simulator' && (
              <GridSimulator
                initialInputs={gridInputs}
                onSaveInputs={(updated) => {
                  setGridInputs(updated);
                  storageService.saveGridInputs(updated, session?.user?.id);
                  syncToCloud(accounts, holdings, watchlist, updated);
                }}
              />
            )}
          </div>
        )}

        {/* ==================== TAB 4: SETTINGS & SECURITY ==================== */}
        {activeTab === 'settings' && (
          <SettingsView
            accounts={accounts}
            holdings={holdings}
            quotes={quotes}
            watchlist={watchlist}
            gridInputs={gridInputs}
            plannerInputs={plannerInputs}
            onUpdatePlannerInputs={handlePlannerInputChange}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            username={session?.user?.username}
            isLoggedIn={Boolean(session && !session.isGuest)}
            isBackendOnline={isBackendOnline}
            onRefreshQuotes={() => refreshQuotes(true)}
            onRestoreBackup={handleRestoreBackup}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setIsAuthModalOpen(false);
          setIsAddModalOpen(false);
          setIsAccountsModalOpen(false);
          setActiveTab(tab);
        }}
        watchlistTriggerCount={watchlistTriggerCount}
        isBackendOffline={!isBackendOnline}
      />

      {/* Modals */}
      <AddHoldingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        accounts={accounts}
        defaultAccountId={activeAccountId}
        onSave={handleAddHolding}
      />

      {isAccountsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAccountsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Manage Accounts</h3>
              <button
                type="button"
                onClick={() => setIsAccountsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <AccountsManager
              accounts={accounts}
              holdings={calculatedHoldings}
              onAddAccount={(acc) => {
                const updated = [...accounts, acc];
                handleUpdateAccounts(updated);
              }}
              onDeleteAccount={(id) => {
                const updated = accounts.filter((a) => a.id !== id);
                handleUpdateAccounts(updated);
              }}
            />
          </div>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(newSession) => {
          setSession(newSession);
          setIsAuthModalOpen(false);
        }}
        canDismiss={true}
      />
    </div>
  );
};
export default App;
