import concurrent.futures
import json
import math
import os
import time
import urllib.request
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
import yfinance as yf

CACHE_FILE = os.path.join(os.path.dirname(__file__), "market_cache.json")
CACHE_TTL_SECONDS = 900  # 15 minutes


def clean_float(val: Any, default: Optional[float] = 0.0) -> Optional[float]:
    """Safely converts a value to a finite float, returning default if None, NaN, Inf, or invalid."""
    if val is None:
        return default
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return f
    except (ValueError, TypeError):
        return default


def is_valid_price(val: Any) -> bool:
    """Returns True only if val is a finite positive float > 0."""
    f = clean_float(val, 0.0)
    return f is not None and f > 0.0


def sanitize_for_json(obj: Any) -> Any:
    """Recursively converts all NaN and Inf float values in dicts/lists to None (JSON null)."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [sanitize_for_json(v) for v in obj]
    return obj

KNOWN_METADATA = {
    # Popular ETFs
    "IVV": {"name": "iShares Core S&P 500 ETF", "sector": "Large Cap Blend", "industry": "S&P 500 Index ETF", "quoteType": "ETF"},
    "VOO": {"name": "Vanguard S&P 500 ETF", "sector": "Large Cap Blend", "industry": "S&P 500 Index ETF", "quoteType": "ETF"},
    "SPY": {"name": "SPDR S&P 500 ETF Trust", "sector": "Large Cap Blend", "industry": "S&P 500 Index ETF", "quoteType": "ETF"},
    "VTI": {"name": "Vanguard Total Stock Market ETF", "sector": "Total Stock Market", "industry": "Broad Market ETF", "quoteType": "ETF"},
    "QQQ": {"name": "Invesco QQQ Trust", "sector": "Technology", "industry": "Large Cap Growth ETF", "quoteType": "ETF"},
    "FNCL": {"name": "Fidelity MSCI Financials ETF", "sector": "Financials", "industry": "Financials ETF", "quoteType": "ETF"},
    "FTEC": {"name": "Fidelity MSCI Info Tech ETF", "sector": "Technology", "industry": "Technology ETF", "quoteType": "ETF"},
    "SCHD": {"name": "Schwab U.S. Dividend Equity ETF", "sector": "Large Value", "industry": "Dividend ETF", "quoteType": "ETF"},
    "VUG": {"name": "Vanguard Growth ETF", "sector": "Large Cap Growth", "industry": "Growth Index ETF", "quoteType": "ETF"},
    "VTV": {"name": "Vanguard Value ETF", "sector": "Large Cap Value", "industry": "Value Index ETF", "quoteType": "ETF"},
    "IWM": {"name": "iShares Russell 2000 ETF", "sector": "Small Cap Blend", "industry": "Small Cap ETF", "quoteType": "ETF"},
    "VXUS": {"name": "Vanguard Total International Stock ETF", "sector": "International Blend", "industry": "Foreign Large Cap ETF", "quoteType": "ETF"},
    "BND": {"name": "Vanguard Total Bond Market ETF", "sector": "Fixed Income", "industry": "Total Bond Market ETF", "quoteType": "ETF"},
    "AGG": {"name": "iShares Core U.S. Aggregate Bond ETF", "sector": "Fixed Income", "industry": "Core Bond ETF", "quoteType": "ETF"},

    # Popular Mutual Funds
    "FZROX": {"name": "Fidelity ZERO Total Market Index", "sector": "Total Stock Market", "industry": "Broad Market Fund", "quoteType": "MUTUALFUND"},
    "FXAIX": {"name": "Fidelity 500 Index Fund", "sector": "Large Cap Blend", "industry": "S&P 500 Index Fund", "quoteType": "MUTUALFUND"},
    "FNILX": {"name": "Fidelity ZERO Large Cap Index", "sector": "Large Cap Blend", "industry": "Large Cap Index Fund", "quoteType": "MUTUALFUND"},
    "FSKAX": {"name": "Fidelity Total Market Index Fund", "sector": "Total Stock Market", "industry": "Broad Market Fund", "quoteType": "MUTUALFUND"},
    "VFIAX": {"name": "Vanguard 500 Index Fund Admiral", "sector": "Large Cap Blend", "industry": "S&P 500 Index Fund", "quoteType": "MUTUALFUND"},
    "VTSAX": {"name": "Vanguard Total Stock Market Index Fund", "sector": "Total Stock Market", "industry": "Broad Market Fund", "quoteType": "MUTUALFUND"},
    "VBTLX": {"name": "Vanguard Total Bond Market Index Fund", "sector": "Fixed Income", "industry": "Total Bond Fund", "quoteType": "MUTUALFUND"},

    # Core Stock Holdings
    "AAL": {"name": "American Airlines Group", "sector": "Industrials", "industry": "Airlines", "quoteType": "EQUITY"},
    "AMAT": {"name": "Applied Materials Inc.", "sector": "Technology", "industry": "Semiconductor Equipment", "quoteType": "EQUITY"},
    "AMD": {"name": "Advanced Micro Devices", "sector": "Technology", "industry": "Semiconductors", "quoteType": "EQUITY"},
    "DVN": {"name": "Devon Energy Corp.", "sector": "Energy", "industry": "Oil & Gas E&P", "quoteType": "EQUITY"},
    "KO": {"name": "The Coca-Cola Company", "sector": "Consumer Defensive", "industry": "Beverages", "quoteType": "EQUITY"},
    "ACLS": {"name": "Axcelis Technologies", "sector": "Technology", "industry": "Semiconductor Equipment", "quoteType": "EQUITY"},
    "ASML": {"name": "ASML Holding NV", "sector": "Technology", "industry": "Semiconductor Lithography", "quoteType": "EQUITY"},
    "AMZN": {"name": "Amazon.com Inc.", "sector": "Consumer Cyclical", "industry": "Internet Retail & Cloud", "quoteType": "EQUITY"},
    "GOOG": {"name": "Alphabet Inc.", "sector": "Communication Services", "industry": "Internet Content & Info", "quoteType": "EQUITY"},
    "AAPL": {"name": "Apple Inc.", "sector": "Technology", "industry": "Consumer Electronics", "quoteType": "EQUITY"},
    "MSFT": {"name": "Microsoft Corporation", "sector": "Technology", "industry": "Software - Infrastructure", "quoteType": "EQUITY"},
    "NVDA": {"name": "NVIDIA Corporation", "sector": "Technology", "industry": "Semiconductors", "quoteType": "EQUITY"},
    "TSLA": {"name": "Tesla, Inc.", "sector": "Consumer Cyclical", "industry": "Auto Manufacturers", "quoteType": "EQUITY"},
}


class MarketService:
    def __init__(self):
        self._cache = self._load_cache()

    def _load_cache(self) -> Dict[str, dict]:
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return sanitize_for_json(data) if isinstance(data, dict) else {}
            except Exception as e:
                print(f"[MarketService] Error loading cache: {e}")
        return {}

    def _save_cache(self):
        try:
            sanitized = sanitize_for_json(self._cache)
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(sanitized, f, indent=2, allow_nan=False)
        except Exception as e:
            print(f"[MarketService] Error saving cache: {e}")

    def _deduce_fund_metadata(self, name: str, quote_type: str) -> tuple:
        n = (name or "").lower()
        suffix = "ETF" if quote_type == "ETF" else "Fund"
        if "s&p 500" in n or "500 index" in n or "sp 500" in n:
            return "Large Cap Blend", f"S&P 500 Index {suffix}"
        if "total market" in n or "total stock" in n or "zero total" in n:
            return "Total Stock Market", f"Broad Market {suffix}"
        if "nasdaq" in n or "qqq" in n or "tech" in n or "info tech" in n:
            return "Technology", f"Technology {suffix}"
        if "financial" in n:
            return "Financials", f"Financials {suffix}"
        if "dividend" in n:
            return "Large Cap Value", f"Dividend {suffix}"
        if "growth" in n:
            return "Large Cap Growth", f"Growth {suffix}"
        if "value" in n:
            return "Large Cap Value", f"Value {suffix}"
        if "health" in n:
            return "Healthcare", f"Healthcare {suffix}"
        if "energy" in n:
            return "Energy", f"Energy {suffix}"
        if "small cap" in n or "russell 2000" in n:
            return "Small Cap Blend", f"Small Cap {suffix}"
        if "international" in n or "foreign" in n or "emerging" in n or "global" in n:
            return "International Blend", f"International {suffix}"
        if "bond" in n or "treasury" in n or "fixed income" in n:
            return "Fixed Income", f"Bond {suffix}"
        if "real estate" in n or "reit" in n:
            return "Real Estate", f"Real Estate {suffix}"
        if quote_type == "ETF":
            return "Large Cap Blend", "Index ETF"
        if quote_type == "MUTUALFUND":
            return "Large Cap Blend", "Index Fund"
        return "Other", "Other"

    def _fetch_search_metadata(self, symbol: str) -> dict:
        try:
            url = f"https://query1.finance.yahoo.com/v1/finance/search?q={symbol}&quotesCount=1"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                quotes = data.get("quotes", [])
                if quotes:
                    q = quotes[0]
                    return {
                        "name": q.get("shortname") or q.get("longname"),
                        "sector": q.get("sector") or q.get("sectorDisp"),
                        "industry": q.get("industry") or q.get("industryDisp"),
                        "quoteType": q.get("quoteType"),
                    }
        except Exception as e:
            print(f"[MarketService] Search metadata fallback skipped for {symbol}: {e}")
        return {}

    def _fetch_symbol_data(self, sym: str, now: float) -> Optional[dict]:
        try:
            ticker = yf.Ticker(sym)
            price = 0.0
            prev_close = 0.0
            fifty_two_high = 0.0
            fifty_two_low = 0.0
            name = sym
            pe_ratio = None
            quote_type = "EQUITY"

            # Tier 1: fast_info (fast, light endpoint, rarely blocked on cloud datacenter IPs)
            try:
                fi = ticker.fast_info
                price = clean_float(getattr(fi, "last_price", None) or getattr(fi, "lastPrice", None), 0.0) or 0.0
                prev_close = clean_float(
                    getattr(fi, "regular_market_previous_close", None)
                    or getattr(fi, "regularMarketPreviousClose", None)
                    or getattr(fi, "previous_close", None)
                    or getattr(fi, "previousClose", None),
                    price
                ) or price
                fifty_two_high = clean_float(getattr(fi, "year_high", None) or getattr(fi, "yearHigh", None), 0.0) or 0.0
                fifty_two_low = clean_float(getattr(fi, "year_low", None) or getattr(fi, "yearLow", None), 0.0) or 0.0
                raw_quote_type = getattr(fi, "quote_type", None) or getattr(fi, "quoteType", "EQUITY")
                if raw_quote_type:
                    quote_type = raw_quote_type
            except Exception as e:
                print(f"[MarketService] fast_info skipped for {sym}: {e}")

            # Tier 2: history chart endpoint fallback if price or 52-wk data is missing
            if not is_valid_price(price) or not is_valid_price(fifty_two_high):
                try:
                    hist = ticker.history(period="5d", interval="1d")
                    if not hist.empty:
                        if not is_valid_price(price):
                            p = clean_float(hist["Close"].iloc[-1], 0.0)
                            if is_valid_price(p):
                                price = p
                                prev = clean_float(hist["Close"].iloc[-2], price) if len(hist) > 1 else price
                                prev_close = prev if is_valid_price(prev) else price
                        if not is_valid_price(fifty_two_high):
                            h = clean_float(hist["High"].max(), 0.0)
                            if is_valid_price(h):
                                fifty_two_high = h
                        if not is_valid_price(fifty_two_low):
                            l = clean_float(hist["Low"].min(), 0.0)
                            if is_valid_price(l):
                                fifty_two_low = l
                except Exception as e:
                    print(f"[MarketService] history fallback skipped for {sym}: {e}")

            # Tier 3: metadata enrichment (ticker.info -> search API -> fund deduction -> known registry)
            known = KNOWN_METADATA.get(sym)
            name = known["name"] if known else sym
            sector = known["sector"] if known else None
            industry = known["industry"] if known else None

            try:
                info = ticker.info or {}
                raw_name = info.get("shortName") or info.get("longName")
                if raw_name:
                    name = raw_name
                raw_pe = info.get("trailingPE") or info.get("forwardPE")
                pe_ratio = clean_float(raw_pe, None)

                raw_sector = info.get("sector") or info.get("category")
                raw_industry = info.get("industry") or info.get("fundFamily")

                if raw_sector and str(raw_sector).upper() not in ("ETF", "OTHER", "MUTUALFUND"):
                    sector = raw_sector
                if raw_industry and str(raw_industry).upper() not in ("ETF", "OTHER", "MUTUALFUND"):
                    industry = raw_industry

                if not is_valid_price(price):
                    info_price = clean_float(
                        info.get("currentPrice")
                        or info.get("regularMarketPrice")
                        or info.get("navPrice")
                        or info.get("previousClose"),
                        0.0
                    )
                    if is_valid_price(info_price):
                        price = info_price
                if not is_valid_price(prev_close) or prev_close == price:
                    info_prev = clean_float(
                        info.get("regularMarketPreviousClose")
                        or info.get("previousClose"),
                        0.0
                    )
                    if is_valid_price(info_prev):
                        prev_close = info_prev
                if not is_valid_price(fifty_two_high):
                    info_high = clean_float(info.get("fiftyTwoWeekHigh"), 0.0)
                    if is_valid_price(info_high):
                        fifty_two_high = info_high
                if not is_valid_price(fifty_two_low):
                    info_low = clean_float(info.get("fiftyTwoWeekLow"), 0.0)
                    if is_valid_price(info_low):
                        fifty_two_low = info_low
            except Exception:
                pass

            # If sector or industry still missing (happens when cloud datacenters are blocked by Yahoo bot checks):
            if not sector or not industry or sector in ("Other", "ETF", "Mutual Fund"):
                search_meta = self._fetch_search_metadata(sym)
                if search_meta.get("name") and (not name or name == sym):
                    name = search_meta["name"]
                if search_meta.get("sector"):
                    sector = search_meta["sector"]
                if search_meta.get("industry"):
                    industry = search_meta["industry"]
                if search_meta.get("quoteType"):
                    quote_type = search_meta["quoteType"]

            # If ETF or Mutual Fund without specific sector/industry, deduce from fund name
            if not sector or not industry or sector in ("Other", "ETF", "Mutual Fund"):
                if quote_type in ("ETF", "MUTUALFUND") or (known and known.get("quoteType") in ("ETF", "MUTUALFUND")):
                    fund_sec, fund_ind = self._deduce_fund_metadata(name, quote_type)
                    if not sector or sector in ("Other", "ETF", "Mutual Fund"):
                        sector = fund_sec
                    if not industry or industry in ("Other", "ETF", "Mutual Fund", sector):
                        industry = fund_ind

            # Final fallback guarantees: non-empty, non-duplicate
            if not sector or sector == "Other":
                sector = "Equities" if quote_type == "EQUITY" else ("Large Cap Blend" if quote_type == "ETF" else "Mutual Funds")
            if not industry or industry in ("Other", sector):
                industry = "General Equity" if quote_type == "EQUITY" else ("Index ETF" if quote_type == "ETF" else "Index Fund")

            # Fallback bounds if 52-week data is still zero/invalid
            if not is_valid_price(fifty_two_high) and is_valid_price(price):
                fifty_two_high = price * 1.05
            if not is_valid_price(fifty_two_low) and is_valid_price(price):
                fifty_two_low = price * 0.95

            # STRICT GUARD: Never return or cache a 0.0 or invalid price!
            if not is_valid_price(price):
                print(f"[MarketService] Warning: Could not resolve valid price for {sym}")
                return None

            if not is_valid_price(prev_close):
                prev_close = price

            change = price - prev_close
            change_pct = ((change / prev_close) * 100) if prev_close > 0 else 0.0

            safe_price = round(float(price), 4)
            safe_change = round(clean_float(change, 0.0) or 0.0, 4)
            safe_change_pct = round(clean_float(change_pct, 0.0) or 0.0, 2)
            safe_high = round(clean_float(fifty_two_high, price) or price, 4)
            safe_low = round(clean_float(fifty_two_low, price) or price, 4)
            safe_pe = round(float(pe_ratio), 2) if pe_ratio is not None else None

            quote_data = {
                "symbol": sym,
                "name": str(name),
                "price": safe_price,
                "change": safe_change,
                "changePercent": safe_change_pct,
                "fiftyTwoWeekHigh": safe_high,
                "fiftyTwoWeekLow": safe_low,
                "peRatio": safe_pe,
                "sector": str(sector),
                "industry": str(industry),
                "quoteType": str(quote_type).upper(),
                "lastUpdated": datetime.now(timezone.utc).isoformat(),
                "_cached_at": now,
                "isStale": False,
            }

            return sanitize_for_json(quote_data)

        except Exception as e:
            print(f"[MarketService] Error fetching {sym}: {e}")
            return None

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

        print(f"[MarketService] Fetching {len(symbols_to_fetch)} symbols in parallel from yfinance: {symbols_to_fetch}")

        max_workers = min(10, len(symbols_to_fetch))
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_sym = {
                executor.submit(self._fetch_symbol_data, sym, now): sym
                for sym in symbols_to_fetch
            }
            for future in concurrent.futures.as_completed(future_to_sym):
                sym = future_to_sym[future]
                try:
                    quote_data = future.result()
                    if quote_data:
                        results[sym] = quote_data
                        self._cache[sym] = quote_data
                    elif sym in self._cache and is_valid_price(self._cache[sym].get("price")):
                        stale_entry = sanitize_for_json(dict(self._cache[sym]))
                        stale_entry["isStale"] = True
                        results[sym] = stale_entry
                except Exception as e:
                    print(f"[MarketService] Worker exception for {sym}: {e}")
                    if sym in self._cache and is_valid_price(self._cache[sym].get("price")):
                        stale_entry = sanitize_for_json(dict(self._cache[sym]))
                        stale_entry["isStale"] = True
                        results[sym] = stale_entry

        self._save_cache()
        return sanitize_for_json(results)

    def get_all_cached(self) -> Dict[str, dict]:
        return self._cache


market_service = MarketService()
