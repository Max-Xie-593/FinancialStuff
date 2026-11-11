import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Account, HoldingLot, MarketQuote, WatchlistStock, GridSimInputs, AssetCategory } from './types/investment';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { AuthSession } from './types/auth';
import { fetchMarketQuotes, checkBackendHealth } from './services/marketApi';
import { calculateHoldingMetrics, aggregatePortfolio } from './engine/portfolioEngine';
import { Header } from './components/Header';
import { AccountSelector } from './components/AccountSelector';
import { CategorySelector } from './components/CategorySelector';
import { PortfolioSummaryCards } from './components/PortfolioSummaryCards';
import { HoldingsTable } from './components/HoldingsTable';
import { AddHoldingModal } from './components/AddHoldingModal';
import { Watchlist52Wk } from './components/Watchlist52Wk';
import { GridSimulator } from './components/GridSimulator';
import { AccountsManager } from './components/AccountsManager';
import { AuthModal } from './components/AuthModal';
import { exportFullPortfolioBackup, parseAndValidatePortfolioBackup } from './utils/scenarioIO';

export const App: React.FC = () => {
  // Auth state
  const [session, setSession] = useState<AuthSession | null>(() => authService.getSession());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // State from storage service scoped to current user
  const [accounts, setAccounts] = useState<Account[]>(() => storageService.getAccounts(session?.user?.id));
  const [activeAccountId, setActiveAccountId] = useState<string>(() => storageService.getActiveAccountId(session?.user?.id));
  const [holdings, setHoldings] = useState<HoldingLot[]>(() => storageService.getHoldings(session?.user?.id));
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>(() => storageService.getWatchlist(session?.user?.id));
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>(() => storageService.getCachedQuotes());
  const [gridInputs, setGridInputs] = useState<GridSimInputs>(() => storageService.getGridInputs(session?.user?.id));

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'portfolio' | 'watchlist' | 'simulator' | 'accounts'>('portfolio');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | AssetCategory>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<HoldingLot | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Subscribe to auth changes (login, logout, switch user)
  useEffect(() => {
    const unsub = authService.subscribe((newSession) => {
      setSession(newSession);
      const uid = newSession?.user?.id;
      setAccounts(storageService.getAccounts(uid));
      setActiveAccountId(storageService.getActiveAccountId(uid));
      setHoldings(storageService.getHoldings(uid));
      setWatchlist(storageService.getWatchlist(uid));
      setGridInputs(storageService.getGridInputs(uid));

      // If user is authenticated online, fetch synced portfolio from backend
      if (newSession && !newSession.isGuest && uid) {
        storageService.fetchFromBackend(uid).then((cloudData) => {
          if (cloudData) {
            setAccounts(cloudData.accounts);
            setHoldings(cloudData.holdings);
            setWatchlist(cloudData.watchlist);
            setGridInputs(cloudData.gridInputs);
            storageService.saveAccounts(cloudData.accounts, uid);
            storageService.saveHoldings(cloudData.holdings, uid);
            storageService.saveWatchlist(cloudData.watchlist, uid);
            storageService.saveGridInputs(cloudData.gridInputs, uid);
          }
        });
      }
    });
    return unsub;
  }, []);

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

  // Derive all active ticker symbols (from holdings + watchlist)
  const allSymbols = useMemo(() => {
    const syms = new Set<string>();
    holdings.forEach((h) => syms.add(h.symbol.toUpperCase()));
    watchlist.forEach((w) => syms.add(w.symbol.toUpperCase()));
    return Array.from(syms);
  }, [holdings, watchlist]);

  // Sync quotes function
  const refreshQuotes = useCallback(async (force: boolean = false) => {
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
  }, [allSymbols]);

  // Initial check on mount
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

  // Account switching handler
  const handleSelectAccount = (id: string) => {
    setActiveAccountId(id);
    storageService.setActiveAccountId(id, session?.user?.id);
  };

  // Holdings handlers
  const handleAddHolding = (lot: HoldingLot) => {
    const updated = [lot, ...holdings];
    setHoldings(updated);
    storageService.saveHoldings(updated, session?.user?.id);
    syncToCloud(accounts, updated, watchlist, gridInputs);
    // Fetch quote for newly added ticker if not present
    if (!quotes[lot.symbol.toUpperCase()]) {
      refreshQuotes(false);
    }
  };

  const handleSaveHolding = (lot: HoldingLot) => {
    if (editingHolding) {
      const updated = holdings.map((h) => (h.id === lot.id ? lot : h));
      setHoldings(updated);
      storageService.saveHoldings(updated, session?.user?.id);
      syncToCloud(accounts, updated, watchlist, gridInputs);
      setEditingHolding(null);
      setIsAddModalOpen(false);
      if (!quotes[lot.symbol.toUpperCase()]) {
        refreshQuotes(false);
      }
    } else {
      handleAddHolding(lot);
    }
  };

  const handleDeleteHolding = (id: string) => {
    const updated = holdings.filter((h) => h.id !== id);
    setHoldings(updated);
    storageService.saveHoldings(updated, session?.user?.id);
    syncToCloud(accounts, updated, watchlist, gridInputs);
  };

  // Accounts handlers
  const handleAddAccount = (acc: Account) => {
    const updated = [...accounts, acc];
    setAccounts(updated);
    storageService.saveAccounts(updated, session?.user?.id);
    syncToCloud(updated, holdings, watchlist, gridInputs);
  };

  const handleDeleteAccount = (id: string) => {
    const updatedAccs = accounts.filter((a) => a.id !== id);
    const updatedLots = holdings.filter((h) => h.accountId !== id);
    setAccounts(updatedAccs);
    setHoldings(updatedLots);
    storageService.saveAccounts(updatedAccs, session?.user?.id);
    storageService.saveHoldings(updatedLots, session?.user?.id);
    syncToCloud(updatedAccs, updatedLots, watchlist, gridInputs);
    if (activeAccountId === id) {
      handleSelectAccount('ALL');
    }
  };

  // Watchlist handlers
  const handleAddWatchlistStock = (stock: WatchlistStock) => {
    const updated = [stock, ...watchlist.filter((w) => w.symbol !== stock.symbol)];
    setWatchlist(updated);
    storageService.saveWatchlist(updated, session?.user?.id);
    syncToCloud(accounts, holdings, updated, gridInputs);
    if (!quotes[stock.symbol.toUpperCase()]) {
      refreshQuotes(false);
    }
  };

  const handleRemoveWatchlistStock = (sym: string) => {
    const updated = watchlist.filter((w) => w.symbol !== sym);
    setWatchlist(updated);
    storageService.saveWatchlist(updated, session?.user?.id);
    syncToCloud(accounts, holdings, updated, gridInputs);
  };

  const handleUpdateTargetPct = (sym: string, newTarget: number) => {
    const updated = watchlist.map((w) =>
      w.symbol === sym ? { ...w, targetBuyPctOfHigh: newTarget } : w
    );
    setWatchlist(updated);
    storageService.saveWatchlist(updated, session?.user?.id);
    syncToCloud(accounts, holdings, updated, gridInputs);
  };

  // Grid simulator handler
  const handleSaveGridInputs = (inputs: GridSimInputs) => {
    setGridInputs(inputs);
    storageService.saveGridInputs(inputs, session?.user?.id);
    syncToCloud(accounts, holdings, watchlist, inputs);
  };

  // Full Portfolio Backup & Restore
  const handleExportBackup = () => {
    exportFullPortfolioBackup({
      accounts,
      holdings,
      watchlist,
      gridInputs,
      activeAccountId,
      exportedAt: new Date().toISOString(),
      user: session?.user?.username,
    });
  };

  const handleRestoreBackupFile = async (file: File) => {
    try {
      const data = await parseAndValidatePortfolioBackup(file);
      if (
        window.confirm(
          `Restore portfolio backup containing ${data.holdings.length} holdings and ${data.accounts.length} accounts? This will update your current portfolio workspace.`
        )
      ) {
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
        alert('Portfolio backup restored successfully!');
      }
    } catch (err: any) {
      alert(`Failed to restore backup: ${err.message}`);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  // Calculate holdings metrics
  const calculatedHoldings = useMemo(() => {
    return holdings.map((lot) => calculateHoldingMetrics(lot, quotes));
  }, [holdings, quotes]);

  // 1. Filter holdings for the active account
  const accountHoldings = useMemo(() => {
    if (activeAccountId === 'ALL') return calculatedHoldings;
    return calculatedHoldings.filter((h) => h.accountId === activeAccountId);
  }, [calculatedHoldings, activeAccountId]);

  // 2. Overall account summary (across all categories in the active account, for full portfolio context)
  const overallAccountSummary = useMemo(() => {
    return aggregatePortfolio(accountHoldings);
  }, [accountHoldings]);

  // 3. Category statistics within the active account (for pill counts and values)
  const categoryStats = useMemo(() => {
    const stats: Record<AssetCategory | 'ALL', { count: number; value: number }> = {
      ALL: { count: accountHoldings.length, value: 0 },
      Stock: { count: 0, value: 0 },
      Dividend: { count: 0, value: 0 },
      Berkshire: { count: 0, value: 0 },
      ETF: { count: 0, value: 0 },
      MutualFund: { count: 0, value: 0 },
    };

    accountHoldings.forEach((h) => {
      stats.ALL.value += h.currentValue;
      if (stats[h.category]) {
        stats[h.category].count += 1;
        stats[h.category].value += h.currentValue;
      }
    });

    return stats;
  }, [accountHoldings]);

  // 4. Holdings filtered by both active account AND selected asset category
  const activeCategoryHoldings = useMemo(() => {
    if (selectedCategory === 'ALL') return accountHoldings;
    return accountHoldings.filter((h) => h.category === selectedCategory);
  }, [accountHoldings, selectedCategory]);

  // 5. Aggregate summary for the selected subset of assets (or all assets)
  const categorySummary = useMemo(() => {
    return aggregatePortfolio(activeCategoryHoldings);
  }, [activeCategoryHoldings]);

  // Count of positions by account for the account switcher pills
  const positionCountByAccount = useMemo(() => {
    const counts: Record<string, number> = {};
    holdings.forEach((h) => {
      counts[h.accountId] = (counts[h.accountId] || 0) + 1;
    });
    return counts;
  }, [holdings]);

  // Most recent quote update timestamp
  const latestQuoteTime = useMemo(() => {
    const quoteList = Object.values(quotes);
    if (quoteList.length === 0) return undefined;
    return quoteList.reduce((max, q) => (!max || q.lastUpdated > max ? q.lastUpdated : max), '');
  }, [quotes]);

  const hasStaleQuotes = useMemo(() => {
    return Object.values(quotes).some((q) => q.isStale);
  }, [quotes]);

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendOnline={isBackendOnline}
        isRefreshing={isRefreshing}
        onRefresh={() => refreshQuotes(true)}
        lastUpdated={latestQuoteTime}
        hasStaleQuotes={hasStaleQuotes}
        user={session?.user || null}
        isGuest={!!session?.isGuest}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onBackup={handleExportBackup}
        onRestoreFile={handleRestoreBackupFile}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Tab 1: Portfolio Holdings */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            {/* Account Switcher Bar */}
            <AccountSelector
              accounts={accounts}
              activeAccountId={activeAccountId}
              onSelectAccount={handleSelectAccount}
              onAddAccountClick={() => setIsAddModalOpen(true)}
              positionCountByAccount={positionCountByAccount}
            />

            {/* Asset Category / Subset Switcher Bar */}
            <CategorySelector
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categoryStats={categoryStats}
            />

            {/* Metric Cards (Big Values for Account & Selected Asset Subset) */}
            <PortfolioSummaryCards
              summary={categorySummary}
              overallTotalValue={overallAccountSummary.totalCurrentValue}
              selectedCategory={selectedCategory}
            />

            {/* Holdings Table */}
            <HoldingsTable
              holdings={accountHoldings}
              accounts={accounts}
              activeAccountId={activeAccountId}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onAddPositionClick={() => {
                setEditingHolding(null);
                setIsAddModalOpen(true);
              }}
              onDeletePosition={handleDeleteHolding}
              onEditPosition={(holding) => setEditingHolding(holding)}
            />
          </div>
        )}

        {/* Tab 2: 52-Week High Strategy Watchlist */}
        {activeTab === 'watchlist' && (
          <Watchlist52Wk
            watchlist={watchlist}
            quotes={quotes}
            onAddStock={handleAddWatchlistStock}
            onRemoveStock={handleRemoveWatchlistStock}
            onUpdateTargetPct={handleUpdateTargetPct}
          />
        )}

        {/* Tab 3: Return Estimation Grid Simulator */}
        {activeTab === 'simulator' && (
          <GridSimulator
            initialInputs={gridInputs}
            onSaveInputs={handleSaveGridInputs}
          />
        )}

        {/* Tab 4: Accounts & Lots Management */}
        {activeTab === 'accounts' && (
          <AccountsManager
            accounts={accounts}
            holdings={calculatedHoldings}
            onAddAccount={handleAddAccount}
            onDeleteAccount={handleDeleteAccount}
          />
        )}
      </main>

      {/* Add / Edit Position Modal */}
      <AddHoldingModal
        isOpen={isAddModalOpen || editingHolding !== null}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingHolding(null);
        }}
        accounts={accounts}
        defaultAccountId={activeAccountId}
        onSave={handleSaveHolding}
        initialHolding={editingHolding}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        canDismiss={true}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
