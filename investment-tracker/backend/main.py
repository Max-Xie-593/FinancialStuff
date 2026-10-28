import base64
import hashlib
import hmac
import json
import math
import os
import time
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from market_service import market_service
import db


def sanitize_for_json(obj: Any) -> Any:
    """Recursively replaces all NaN, Infinity, -Infinity floats with None (JSON null)."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [sanitize_for_json(v) for v in obj]
    return obj


class SafeJSONResponse(JSONResponse):
    """Guarantees that no response ever fails with 'Out of range float values are not JSON compliant'."""
    def render(self, content: Any) -> bytes:
        return super().render(sanitize_for_json(content))


app = FastAPI(
    title="Investment Tracker API & Auth Service",
    version="1.0.0",
    default_response_class=SafeJSONResponse,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.environ.get("JWT_SECRET", "investment-tracker-secure-secret-2026")


def create_access_token(user_id: str, username: str) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "exp": int(time.time()) + (30 * 86400),  # 30-day session
    }
    payload_bytes = json.dumps(payload).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode("utf-8").rstrip("=")
    signature = hmac.new(SECRET_KEY.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"


def verify_access_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_b64, signature = parts
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            return None
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required")
    token = authorization.split(" ")[1]
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User account not found")
    return user


# Request Models
class QuotesRequest(BaseModel):
    symbols: List[str]
    force_refresh: bool = False


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    displayName: Optional[str] = None


class PortfolioSyncRequest(BaseModel):
    portfolio: Dict[str, Any]


# Health & Market Routes
@app.get("/")
def root():
    return {"status": "ok", "service": "investment-tracker-backend", "health": "/api/health"}


@app.get("/api/health")
@app.get("/health")
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


# Authentication Endpoints
@app.post("/api/auth/register")
def register(req: RegisterRequest):
    try:
        user = db.create_user(req.username, req.password, display_name=req.displayName)
        token = create_access_token(user["id"], user["username"])
        return {
            "token": token,
            "user": user,
            "message": "Account created successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/auth/login")
def login(req: LoginRequest):
    user = db.authenticate_user(req.username, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(user["id"], user["username"])
    return {
        "token": token,
        "user": user,
        "message": "Login successful"
    }


@app.get("/api/auth/me")
def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    return {"user": user}


# User-Scoped Portfolio Document Sync Endpoints
@app.get("/api/user/portfolio")
def fetch_user_portfolio(user: Dict[str, Any] = Depends(get_current_user)):
    data = db.get_user_portfolio(user["id"])
    return {"portfolio": data}


@app.post("/api/user/portfolio")
def update_user_portfolio(req: PortfolioSyncRequest, user: Dict[str, Any] = Depends(get_current_user)):
    db.save_user_portfolio(user["id"], req.portfolio)
    return {"status": "ok", "message": "Portfolio synced successfully"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    is_dev = os.environ.get("ENV", "development").lower() == "development"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=is_dev)
