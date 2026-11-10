import React from 'react';

interface RangeBar52WkProps {
  currentPrice: number;
  low: number;
  high: number;
  targetBuyPct?: number; // e.g. 0.674
}

export const RangeBar52Wk: React.FC<RangeBar52WkProps> = ({
  currentPrice,
  low,
  high,
  targetBuyPct,
}) => {
  const range = high - low;
  const clampedPrice = Math.max(low, Math.min(high, currentPrice));
  const currentPct = range > 0 ? ((clampedPrice - low) / range) * 100 : 50;

  // Calculate target buy price point along the range bar
  const targetPrice = targetBuyPct ? high * targetBuyPct : null;
  const targetPct =
    targetPrice && range > 0
      ? Math.max(0, Math.min(100, ((targetPrice - low) / range) * 100))
      : null;

  const pctOfHigh = high > 0 ? (currentPrice / high) * 100 : 100;
  const isBelowTarget = targetPrice ? currentPrice <= targetPrice : false;

  return (
    <div className="range-bar-container" title={`52W Low: $${low.toFixed(2)} | Current: $${currentPrice.toFixed(2)} | 52W High: $${high.toFixed(2)}`}>
      <div className="range-bar-labels" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '4px' }}>
        <span className="text-muted range-label-bound">${low.toFixed(0)}</span>
        <span className={`range-label-pct font-mono ${isBelowTarget ? 'text-success font-bold' : 'text-main'}`}>
          {pctOfHigh.toFixed(0)}%
        </span>
        <span className="text-muted range-label-bound">${high.toFixed(0)}</span>
      </div>

      <div className="range-track" style={{ position: 'relative', width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.12)', borderRadius: '3px', overflow: 'visible' }}>
        {/* Target Buy Threshold Zone */}
        {targetPct !== null && (
          <div
            className="target-threshold-marker"
            style={{ left: `${targetPct}%` }}
            title={`Buy Target Trigger: $${targetPrice?.toFixed(2)} (${(targetBuyPct! * 100).toFixed(1)}% of High)`}
          />
        )}

        {/* Current Price Marker */}
        <div
          className={`current-price-marker ${isBelowTarget ? 'marker-buy' : ''}`}
          style={{ left: `${Math.max(2, Math.min(98, currentPct))}%` }}
        />
      </div>
    </div>
  );
};
