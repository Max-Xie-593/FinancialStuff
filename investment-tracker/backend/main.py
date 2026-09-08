from typing import List
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from market_service import market_service

app = FastAPI(title="Investment Tracker Market Data Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QuotesRequest(BaseModel):
    symbols: List[str]
    force_refresh: bool = False


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "investment-tracker-backend"}


@app.get("/api/quote/{symbol}")
def get_quote(symbol: str, force_refresh: bool = False):
    quote = market_service.get_single_quote(symbol, force_refresh=force_refresh)
    if not quote:
        return {"error": f"Symbol '{symbol}' not found or could not be fetched", "symbol": symbol}
    return quote


@app.post("/api/quotes")
def get_batch_quotes(req: QuotesRequest):
    return market_service.get_batch_quotes(req.symbols, force_refresh=req.force_refresh)


@app.get("/api/cache")
def get_cached_quotes():
    return market_service.get_all_cached()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
