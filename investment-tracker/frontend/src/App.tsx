import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Account, HoldingLot, MarketQuote, WatchlistStock, GridSimInputs } from './types/investment';
import { storageService } from './services/storageService';
import { fetchMarketQuotes, checkBackendHealth } from './services/marketApi';
import { calculateHoldingMetrics, aggregatePortfolio } from './engine/portfolioEngine';
import { Header } from './components/Header';
import { AccountSelector } from './components/AccountSelector';
import { PortfolioSummaryCards } from './components/PortfolioSummaryCards';
import { HoldingsTable } from './components/HoldingsTable';
import { AddHoldingModal } from './components/AddHoldingModal';
import { Watchlist52Wk } from './components/Watchlist52Wk';
import { GridSimulator } from './components/GridSimulator';
import { AccountsManager } from './components/AccountsManager';

export const App: React.FC = () => {
  // State from storage service
  const [accounts, setAccounts] = useState<Account[]>(() => storageService.getAccounts());
  const [activeAccountId, setActiveAccountId] = useState<string>(() => storageService.getActiveAccountId());
  const [holdings, setHoldings] = useState<HoldingLot[]>(() => storageService.getHoldings());
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>(() => storageService.getWatchlist());
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>(() => storageService.getCachedQuotes());
  const [gridInputs, setGridInputs] = useState<GridSimInputs>(() => storageService.getGridInputs());

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'portfolio' | 'watchlist' | 'simulator' | 'accounts'>('portfolio');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    storageService.setActiveAccountId(id);
  };

  // Holdings handlers
  const handleAddHolding = (lot: HoldingLot) => {
    const updated = [lot, ...holdings];
    setHoldings(updated);
    storageService.saveHoldings(updated);
    // Fetch quote for newly added ticker if not present
    if (!quotes[lot.symbol.toUpperCase()]) {
      refreshQuotes(false);
    }
  };

  const handleDeleteHolding = (id: string) => {
    const updated = holdings.filter((h) => h.id !== id);
    setHoldings(updated);
    storageService.saveHoldings(updated);
  };

  // Accounts handlers
  const handleAddAccount = (acc: Account) => {
    const updated = [...accounts, acc];
    setAccounts(updated);
    storageService.saveAccounts(updated);
  };

  const handleDeleteAccount = (id: string) => {
    const updatedAccs = accounts.filter((a) => a.id !== id);
    const updatedLots = holdings.filter((h) => h.accountId !== id);
    setAccounts(updatedAccs);
    setHoldings(updatedLots);
    storageService.saveAccounts(updatedAccs);
    storageService.saveHoldings(updatedLots);
    if (activeAccountId === id) {
      handleSelectAccount('ALL');
    }
  };

  // Watchlist handlers
  const handleAddWatchlistStock = (stock: WatchlistStock) => {
    const updated = [stock, ...watchlist.filter((w) => w.symbol !== stock.symbol)];
    setWatchlist(updated);
    storageService.saveWatchlist(updated);
    if (!quotes[stock.symbol.toUpperCase()]) {
      refreshQuotes(false);
    }
  };

  const handleRemoveWatchlistStock = (sym: string) => {
    const updated = watchlist.filter((w) => w.symbol !== sym);
    setWatchlist(updated);
    storageService.saveWatchlist(updated);
  };

  const handleUpdateTargetPct = (sym: string, newTarget: number) => {
    const updated = watchlist.map((w) =>
      w.symbol === sym ? { ...w, targetBuyPctOfHigh: newTarget } : w
    );
    setWatchlist(updated);
    storageService.saveWatchlist(updated);
  };

  // Grid simulator handler
  const handleSaveGridInputs = (inputs: GridSimInputs) => {
    setGridInputs(inputs);
    storageService.saveGridInputs(inputs);
  };

  // Calculate holdings metrics
  const calculatedHoldings = useMemo(() => {
    return holdings.map((lot) => calculateHoldingMetrics(lot, quotes));
  }, [holdings, quotes]);

  // Filter holdings for the active account
  const activeHoldings = useMemo(() => {
    if (activeAccountId === 'ALL') return calculatedHoldings;
    return calculatedHoldings.filter((h) => h.accountId === activeAccountId);
  }, [calculatedHoldings, activeAccountId]);

  // Aggregate summary
  const portfolioSummary = useMemo(() => {
    return aggregatePortfolio(activeHoldings);
  }, [activeHoldings]);

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

            {/* Metric Cards */}
            <PortfolioSummaryCards summary={portfolioSummary} />

            {/* Holdings Table */}
            <HoldingsTable
              holdings={activeHoldings}
              accounts={accounts}
              activeAccountId={activeAccountId}
              onAddPositionClick={() => setIsAddModalOpen(true)}
              onDeletePosition={handleDeleteHolding}
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

      {/* Add Position Modal */}
      <AddHoldingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        accounts={accounts}
        defaultAccountId={activeAccountId}
        onSave={handleAddHolding}
      />
    </div>
  );
};
