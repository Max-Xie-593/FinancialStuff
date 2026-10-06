import hashlib
import json
import os
import secrets
import sqlite3
from datetime import datetime, timezone
from typing import Optional, Dict, Any

DB_FILE = os.path.join(os.path.dirname(__file__), "investment_tracker.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()


def init_db():
    with get_connection() as conn:
        cursor = conn.cursor()
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                display_name TEXT,
                created_at TEXT NOT NULL
            )
        """)

        # User portfolio document blob table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_portfolios (
                user_id TEXT PRIMARY KEY,
                portfolio_json TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        conn.commit()

    # Pre-seed demo user if not exists
    try:
        create_user("demo", "demo123", display_name="Demo User")
    except ValueError:
        pass  # Already exists


def create_user(username: str, password: str, display_name: Optional[str] = None) -> Dict[str, Any]:
    clean_username = username.strip().lower()
    if not clean_username or len(password) < 4:
        raise ValueError("Username required and password must be at least 4 characters")

    user_id = f"user_{secrets.token_hex(8)}"
    salt = secrets.token_hex(16)
    pwd_hash = hash_password(password, salt)
    now = datetime.now(timezone.utc).isoformat()
    disp_name = (display_name or username).strip()

    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO users (id, username, password_hash, salt, display_name, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (user_id, clean_username, pwd_hash, salt, disp_name, now)
            )
            conn.commit()
    except sqlite3.IntegrityError:
        raise ValueError(f"Username '{clean_username}' already exists")

    return {
        "id": user_id,
        "username": clean_username,
        "displayName": disp_name,
        "createdAt": now
    }


def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    clean_username = username.strip().lower()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (clean_username,))
        row = cursor.fetchone()
        if not row:
            return None

        salt = row["salt"]
        expected_hash = row["password_hash"]
        actual_hash = hash_password(password, salt)

        if secrets.compare_digest(expected_hash, actual_hash):
            return {
                "id": row["id"],
                "username": row["username"],
                "displayName": row["display_name"],
                "createdAt": row["created_at"]
            }
        return None


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, display_name, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if row:
            return {
                "id": row["id"],
                "username": row["username"],
                "displayName": row["display_name"],
                "createdAt": row["created_at"]
            }
        return None


def get_user_portfolio(user_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT portfolio_json FROM user_portfolios WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        if row and row["portfolio_json"]:
            try:
                return json.loads(row["portfolio_json"])
            except Exception:
                return None
        return None


def save_user_portfolio(user_id: str, portfolio_data: Dict[str, Any]):
    now = datetime.now(timezone.utc).isoformat()
    json_str = json.dumps(portfolio_data)
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO user_portfolios (user_id, portfolio_json, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                portfolio_json = excluded.portfolio_json,
                updated_at = excluded.updated_at
        """, (user_id, json_str, now))
        conn.commit()


# Initialize on import
init_db()
