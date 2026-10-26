import json
import os
import time
import urllib.request
from datetime import datetime, timezone
from typing import Dict, List, Optional
import yfinance as yf

CACHE_FILE = os.path.join(os.path.dirname(__file__), "market_cache.json")
CACHE_TTL_SECONDS = 900  # 15 minutes

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
                    price = float(getattr(fi, "last_price", None) or getattr(fi, "lastPrice", None) or 0.0)
                    prev_close = float(getattr(fi, "previous_close", None) or getattr(fi, "previousClose", None) or price)
                    fifty_two_high = float(getattr(fi, "year_high", None) or getattr(fi, "yearHigh", None) or 0.0)
                    fifty_two_low = float(getattr(fi, "year_low", None) or getattr(fi, "yearLow", None) or 0.0)
                    quote_type = getattr(fi, "quote_type", None) or getattr(fi, "quoteType", "EQUITY")
                except Exception as e:
                    print(f"[MarketService] fast_info skipped for {sym}: {e}")

                # Tier 2: history chart endpoint fallback if price or 52-wk data is missing
                if price <= 0.0 or fifty_two_high <= 0.0:
                    try:
                        hist = ticker.history(period="5d", interval="1d")
                        if not hist.empty:
                            if price <= 0.0:
                                price = float(hist["Close"].iloc[-1])
                                prev_close = float(hist["Close"].iloc[-2]) if len(hist) > 1 else price
                            if fifty_two_high <= 0.0:
                                fifty_two_high = float(hist["High"].max())
                            if fifty_two_low <= 0.0:
                                fifty_two_low = float(hist["Low"].min())
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
                    pe_ratio = info.get("trailingPE") or info.get("forwardPE")

                    raw_sector = info.get("sector") or info.get("category")
                    raw_industry = info.get("industry") or info.get("fundFamily")

                    if raw_sector and raw_sector.upper() not in ("ETF", "OTHER", "MUTUALFUND"):
                        sector = raw_sector
                    if raw_industry and raw_industry.upper() not in ("ETF", "OTHER", "MUTUALFUND"):
                        industry = raw_industry

                    if price <= 0.0:
                        price = float(
                            info.get("currentPrice")
                            or info.get("regularMarketPrice")
                            or info.get("navPrice")
                            or info.get("previousClose")
                            or 0.0
                        )
                    if fifty_two_high <= 0.0:
                        fifty_two_high = float(info.get("fiftyTwoWeekHigh") or (price * 1.05 if price else 0.0))
                    if fifty_two_low <= 0.0:
                        fifty_two_low = float(info.get("fiftyTwoWeekLow") or (price * 0.95 if price else 0.0))
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

                # Fallback bounds if 52-week data is still zero
                if fifty_two_high <= 0.0 and price > 0.0:
                    fifty_two_high = price * 1.05
                if fifty_two_low <= 0.0 and price > 0.0:
                    fifty_two_low = price * 0.95

                # STRICT GUARD: Never return or cache a 0.0 price!
                if price <= 0.0:
                    print(f"[MarketService] Warning: Could not resolve valid price for {sym}")
                    if sym in self._cache and self._cache[sym].get("price", 0.0) > 0.0:
                        stale_entry = dict(self._cache[sym])
                        stale_entry["isStale"] = True
                        results[sym] = stale_entry
                    continue

                change = price - prev_close if prev_close else 0.0
                change_pct = ((change / prev_close) * 100) if prev_close else 0.0

                quote_data = {
                    "symbol": sym,
                    "name": name,
                    "price": round(float(price), 4),
                    "change": round(float(change), 4),
                    "changePercent": round(float(change_pct), 2),
                    "fiftyTwoWeekHigh": round(float(fifty_two_high), 4),
                    "fiftyTwoWeekLow": round(float(fifty_two_low), 4),
                    "peRatio": round(float(pe_ratio), 2) if pe_ratio else None,
                    "sector": str(sector),
                    "industry": str(industry),
                    "quoteType": str(quote_type).upper(),
                    "lastUpdated": datetime.now(timezone.utc).isoformat(),
                    "_cached_at": now,
                    "isStale": False,
                }

                self._cache[sym] = quote_data
                results[sym] = quote_data

            except Exception as e:
                print(f"[MarketService] Error fetching {sym}: {e}")
                # Fallback to existing stale cache if present and valid
                if sym in self._cache and self._cache[sym].get("price", 0.0) > 0.0:
                    stale_entry = dict(self._cache[sym])
                    stale_entry["isStale"] = True
                    results[sym] = stale_entry

        self._save_cache()
        return results

    def get_all_cached(self) -> Dict[str, dict]:
        return self._cache


market_service = MarketService()
