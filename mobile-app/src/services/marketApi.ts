import { MarketQuote } from '../types/investment';
import { storageService } from './storageService';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('it_custom_api_url');
    if (custom && custom.trim()) {
      const clean = custom.trim().replace(/\/$/, '');
      return clean.endsWith('/api') ? clean : `${clean}/api`;
    }
  }
  const rawEnv =
    (import.meta.env.VITE_API_URL as string | undefined) ||
    (import.meta.env.VITE_BACKEND_URL as string | undefined) ||
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
    '';
  if (rawEnv && rawEnv.trim()) {
    const clean = rawEnv.trim().replace(/\/$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  return '/api';
}

export function setCustomApiUrl(url: string | null) {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('it_custom_api_url');
    } else {
      localStorage.setItem('it_custom_api_url', url.trim());
    }
  }
}

export interface SyncResult {
  quotes: Record<string, MarketQuote>;
  isBackendOnline: boolean;
  message?: string;
}

export async function checkBackendHealth(): Promise<boolean> {
  const base = getApiBaseUrl();
  try {
    const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(4000) });
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

  const base = getApiBaseUrl();

  try {
    const response = await fetch(`${base}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols: normalized, force_refresh: forceRefresh }),
      signal: AbortSignal.timeout(60000), // 60s timeout for cloud cold starts and batch fetches
    });

    if (!response.ok) {
      throw new Error(`API server returned status ${response.status}`);
    }

    const fetchedQuotes: Record<string, MarketQuote> = await response.json();
    const merged: Record<string, MarketQuote> = { ...cached };

    for (const [sym, quote] of Object.entries(fetchedQuotes)) {
      if (quote && quote.price > 0) {
        merged[sym] = {
          ...quote,
          isStale: false,
        };
      }
    }

    storageService.saveCachedQuotes(merged);
    return {
      quotes: merged,
      isBackendOnline: true,
      message: `Updated ${Object.keys(fetchedQuotes).length} quotes from market API.`,
    };
  } catch (err: any) {
    console.warn(`[MarketAPI] Quote fetch failed (${err.message}). Using local cache.`);
    return {
      quotes: cached,
      isBackendOnline: false,
      message: err.message || 'Market data backend unreachable.',
    };
  }
}
