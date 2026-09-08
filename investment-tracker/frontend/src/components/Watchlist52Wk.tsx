import React, { useState } from 'react';
import { WatchlistStock, MarketQuote } from '../types/investment';
import { RangeBar52Wk } from './RangeBar52Wk';
import { Compass, Plus, Trash2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface Watchlist52WkProps {
  watchlist: WatchlistStock[];
  quotes: Record<string, MarketQuote>;
  onAddStock: (stock: WatchlistStock) => void;
  onRemoveStock: (symbol: string) => void;
  onUpdateTargetPct: (symbol: string, newTarget: number) => void;
}

export const Watchlist52Wk: React.FC<Watchlist52WkProps> = ({
  watchlist,
  quotes,
  onAddStock,
  onRemoveStock,
  onUpdateTargetPct,
}) => {
  const [newSymbol, setNewSymbol] = useState('');
  const [newTargetPct, setNewTargetPct] = useState('67.4');
  const [newNotes, setNewNotes] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = newSymbol.trim().toUpperCase();
    const pct = parseFloat(newTargetPct);
    if (!sym || isNaN(pct) || pct <= 0) return;

    onAddStock({
      symbol: sym,
      targetBuyPctOfHigh: pct / 100,
      notes: newNotes.trim() || undefined,
    });

    setNewSymbol('');
    setNewNotes('');
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

  return (
    <div className="space-y-6">
      {/* Strategy Banner */}
      <div className="glass-panel info-banner">
        <div className="info-banner-icon">
          <Compass size={24} className="text-cyan" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-main">52-Week High Strategy Watchlist (Buy_List Engine)</h3>
          <p className="text-sm text-muted">
            Monitors target purchase triggers based on an asset's pullback relative to its 52-week High.
            When a stock dips to or below its target threshold (e.g. <strong>&lt; 67.4% of 52-Week High</strong>), an automated <strong>BUY SIGNAL</strong> is triggered.
          </p>
        </div>
      </div>

      {/* Add to Watchlist Bar */}
      <div className="glass-panel p-4">
        <form onSubmit={handleAdd} className="watchlist-add-form">
          <div className="form-group flex-1">
            <label className="form-label">Ticker Symbol</label>
            <input
              type="text"
              placeholder="e.g. NVDA, MSFT, ASML"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group w-48">
            <label className="form-label">Target % of 52W High</label>
            <input
              type="number"
              step="0.1"
              placeholder="67.4"
              value={newTargetPct}
              onChange={(e) => setNewTargetPct(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group flex-1">
            <label className="form-label">Strategy Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. AI Capex cycle / semi equipment moat"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group flex justify-end">
            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
              <span>Add Watchlist Ticker</span>
            </button>
          </div>
        </form>
      </div>

      {/* Watchlist Table */}
      <div className="glass-panel table-panel">
        <div className="table-scroll-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol / Company</th>
                <th className="text-right">Today's Price</th>
                <th className="text-right">P/E Ratio</th>
                <th className="text-right">52W High</th>
                <th className="text-right">52W Low</th>
                <th className="text-right">@52wk-H (% of High)</th>
                <th className="text-right">Target Buy Price</th>
                <th className="text-center" style={{ minWidth: '180px' }}>52-Week Range & Trigger</th>
                <th className="text-center">Decision Signal</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((item) => {
                const quote = quotes[item.symbol.toUpperCase()];
                const price = quote?.price || 0;
                const high = quote?.fiftyTwoWeekHigh || price;
                const low = quote?.fiftyTwoWeekLow || price;
                const pe = quote?.peRatio;

                const pctOfHigh = high > 0 ? (price / high) * 100 : 100;
                const targetPrice = high * item.targetBuyPctOfHigh;
                const isBuySignal = price > 0 && price <= targetPrice;
                const isCloseToBuy = price > targetPrice && price <= targetPrice * 1.05;

                return (
                  <tr key={item.symbol} className="table-row-hover">
                    <td>
                      <div className="symbol-cell">
                        <span className="symbol-ticker">{item.symbol}</span>
                        <span className="symbol-name">{quote?.name || item.name || item.symbol}</span>
                        {item.notes && <span className="text-xs text-dim italic">{item.notes}</span>}
                      </div>
                    </td>

                    <td className="text-right font-mono font-bold">
                      {price > 0 ? formatCurrency(price) : 'Pending Sync'}
                    </td>

                    <td className="text-right font-mono text-muted">
                      {pe ? pe.toFixed(1) : '—'}
                    </td>

                    <td className="text-right font-mono text-main font-medium">
                      {high > 0 ? formatCurrency(high) : '—'}
                    </td>

                    <td className="text-right font-mono text-muted">
                      {low > 0 ? formatCurrency(low) : '—'}
                    </td>

                    {/* @52wk-H */}
                    <td className="text-right font-mono">
                      <span className={`font-bold ${isBuySignal ? 'text-success' : pctOfHigh < 80 ? 'text-warning' : 'text-main'}`}>
                        {pctOfHigh.toFixed(1)}%
                      </span>
                    </td>

                    {/* Target Buy Price */}
                    <td className="text-right font-mono">
                      <span className="text-success font-semibold">{formatCurrency(targetPrice)}</span>
                      <div className="text-xs text-dim flex items-center justify-end gap-1">
                        <input
                          type="number"
                          step="0.5"
                          value={(item.targetBuyPctOfHigh * 100).toFixed(1)}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              onUpdateTargetPct(item.symbol, val / 100);
                            }
                          }}
                          className="form-input text-xs"
                          style={{ width: '56px', padding: '1px 4px', textAlign: 'right', display: 'inline-block' }}
                          title="Edit target % of 52-week High"
                        />
                        <span>% of H</span>
                      </div>
                    </td>

                    {/* 52-Week Range Bar */}
                    <td>
                      <RangeBar52Wk
                        currentPrice={price}
                        low={low}
                        high={high}
                        targetBuyPct={item.targetBuyPctOfHigh}
                      />
                    </td>

                    {/* Decision Signal Badge */}
                    <td className="text-center">
                      {isBuySignal ? (
                        <div className="decision-badge badge-signal-buy animate-pulse-subtle" title="Current price has hit or dropped below target buy threshold">
                          <CheckCircle size={14} />
                          <span>BUY SIGNAL</span>
                        </div>
                      ) : isCloseToBuy ? (
                        <div className="decision-badge badge-signal-watch" title="Within 5% of target buy threshold">
                          <AlertTriangle size={14} />
                          <span>NEAR TARGET</span>
                        </div>
                      ) : (
                        <div className="decision-badge badge-signal-wait" title="Price is above target buy threshold">
                          <Clock size={14} />
                          <span>WAIT / HOLD</span>
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="text-center">
                      <button
                        onClick={() => onRemoveStock(item.symbol)}
                        className="btn-icon-delete"
                        title="Remove from watchlist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
