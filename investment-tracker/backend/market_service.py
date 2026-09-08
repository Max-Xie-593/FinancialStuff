import json
import os
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional
import yfinance as yf

CACHE_FILE = os.path.join(os.path.dirname(__file__), "market_cache.json")
CACHE_TTL_SECONDS = 900  # 15 minutes


class MarketService:
    def __init__(self):
        self._cache = self._load_cache()

    def _load_cache(self) -> Dict[str, dict]:
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[MarketService] Error loading cache: {e}")
        return {}

    def _save_cache(self):
        try:
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(self._cache, f, indent=2)
        except Exception as e:
            print(f"[MarketService] Error saving cache: {e}")

    def get_single_quote(self, symbol: str, force_refresh: bool = False) -> Optional[dict]:
        quotes = self.get_batch_quotes([symbol], force_refresh=force_refresh)
        return quotes.get(symbol.upper())

    def get_batch_quotes(self, symbols: List[str], force_refresh: bool = False) -> Dict[str, dict]:
        now = time.time()
        results: Dict[str, dict] = {}
        symbols_to_fetch: List[str] = []

        normalized = [s.strip().upper() for s in symbols if s.strip()]

        for sym in normalized:
            cached = self._cache.get(sym)
            if not force_refresh and cached:
                cached_time = cached.get("_cached_at", 0)
                if (now - cached_time) < CACHE_TTL_SECONDS:
                    results[sym] = cached
                    continue
            symbols_to_fetch.append(sym)

        if not symbols_to_fetch:
            return results

        print(f"[MarketService] Fetching {len(symbols_to_fetch)} symbols from yfinance: {symbols_to_fetch}")

        for sym in symbols_to_fetch:
            try:
                ticker = yf.Ticker(sym)
                info = ticker.info or {}

                # Price resolution (equities, ETFs, mutual funds)
                price = (
                    info.get("currentPrice")
                    or info.get("regularMarketPrice")
                    or info.get("navPrice")
                    or info.get("previousClose")
                    or 0.0
                )

                prev_close = info.get("previousClose") or price
                change = price - prev_close if price and prev_close else 0.0
                change_pct = ((change / prev_close) * 100) if prev_close else 0.0

                fifty_two_high = info.get("fiftyTwoWeekHigh") or (price * 1.05 if price else 0.0)
                fifty_two_low = info.get("fiftyTwoWeekLow") or (price * 0.95 if price else 0.0)
                pe_ratio = info.get("trailingPE") or info.get("forwardPE")

                quote_data = {
                    "symbol": sym,
                    "name": info.get("shortName") or info.get("longName") or sym,
                    "price": round(float(price), 4),
                    "change": round(float(change), 4),
                    "changePercent": round(float(change_pct), 2),
                    "fiftyTwoWeekHigh": round(float(fifty_two_high), 4),
                    "fiftyTwoWeekLow": round(float(fifty_two_low), 4),
                    "peRatio": round(float(pe_ratio), 2) if pe_ratio else None,
                    "quoteType": info.get("quoteType", "EQUITY"),
                    "lastUpdated": datetime.now(timezone.utc).isoformat(),
                    "_cached_at": now,
                    "isStale": False,
                }

                self._cache[sym] = quote_data
                results[sym] = quote_data

            except Exception as e:
                print(f"[MarketService] Error fetching {sym}: {e}")
                # Fallback to existing stale cache if present
                if sym in self._cache:
                    stale_entry = dict(self._cache[sym])
                    stale_entry["isStale"] = True
                    results[sym] = stale_entry

        self._save_cache()
        return results

    def get_all_cached(self) -> Dict[str, dict]:
        return self._cache


market_service = MarketService()
