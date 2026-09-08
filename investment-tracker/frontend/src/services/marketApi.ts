import { MarketQuote } from '../types/investment';
import { storageService } from './storageService';

const ENV_API_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';
const API_BASE = ENV_API_URL ? `${ENV_API_URL}/api` : '/api';

export interface SyncResult {
  quotes: Record<string, MarketQuote>;
  isBackendOnline: boolean;
  message?: string;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

export async function fetchMarketQuotes(
  symbols: string[],
  forceRefresh: boolean = false
): Promise<SyncResult> {
  const cached = storageService.getCachedQuotes();
  const normalized = Array.from(new Set(symbols.map((s) => s.trim().toUpperCase()))).filter(Boolean);

  if (normalized.length === 0) {
    return { quotes: cached, isBackendOnline: true };
  }

  try {
    const response = await fetch(`${API_BASE}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols: normalized, force_refresh: forceRefresh }),
      signal: AbortSignal.timeout(15000), // 15s timeout for batch yfinance
    });

    if (!response.ok) {
      throw new Error(`API server returned status ${response.status}`);
    }

    const fetchedQuotes: Record<string, MarketQuote> = await response.json();
    const merged: Record<string, MarketQuote> = { ...cached };

    for (const [sym, quote] of Object.entries(fetchedQuotes)) {
      merged[sym] = {
        ...quote,
        isStale: false,
      };
    }

    storageService.saveCachedQuotes(merged);
    return {
      quotes: merged,
      isBackendOnline: true,
      message: `Updated ${Object.keys(fetchedQuotes).length} quotes`,
    };
  } catch (err: any) {
    console.warn('[MarketAPI] Backend request failed, utilizing cached snapshot:', err.message);

    // Mark cached quotes as stale
    const staleQuotes: Record<string, MarketQuote> = {};
    for (const [sym, q] of Object.entries(cached)) {
      staleQuotes[sym] = { ...q, isStale: true };
    }

    return {
      quotes: staleQuotes,
      isBackendOnline: false,
      message: 'Backend server is offline or unreachable. Displaying cached quotes.',
    };
  }
}
