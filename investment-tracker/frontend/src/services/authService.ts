import { AuthSession, LoginCredentials, RegisterCredentials, User } from '../types/auth';

const SESSION_KEY = 'it_auth_session';
const LOCAL_USERS_KEY = 'it_local_users';
const API_BASE = '/api';

interface LocalUserRecord {
  user: User;
  passwordHash: string;
}

// Simple fallback hashing for offline client-side user accounts
function clientHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
}

type AuthListener = (session: AuthSession | null) => void;
const listeners = new Set<AuthListener>();

function notifyListeners(session: AuthSession | null) {
  listeners.forEach((listener) => {
    try {
      listener(session);
    } catch (e) {
      console.error('[AuthService] Listener error:', e);
    }
  });
}

export const authService = {
  subscribe(listener: AuthListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSession(): AuthSession | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setSession(session: AuthSession) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    notifyListeners(session);
  },

  clearSession() {
    localStorage.removeItem(SESSION_KEY);
    notifyListeners(null);
  },

  getAuthHeaders(): Record<string, string> {
    const session = this.getSession();
    if (session?.token) {
      return { Authorization: `Bearer ${session.token}` };
    }
    return {};
  },

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const username = credentials.username.trim().toLowerCase();
    const password = credentials.password;

    // Try backend API first
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        const session: AuthSession = {
          user: data.user,
          token: data.token,
          isGuest: false,
        };
        this.setSession(session);
        return session;
      }

      if (res.status === 401) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Invalid username or password');
      }
    } catch (e: any) {
      // If error is authentication failure (401), rethrow immediately
      if (e.message.includes('Invalid username or password')) {
        throw e;
      }
      console.warn('[AuthService] Backend unavailable, checking local accounts:', e.message);
    }

    // Offline / LocalStorage account fallback
    const localUsers: LocalUserRecord[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
    const found = localUsers.find(
      (u) => u.user.username.toLowerCase() === username && u.passwordHash === clientHash(password)
    );

    if (found) {
      const session: AuthSession = {
        user: found.user,
        isGuest: false,
      };
      this.setSession(session);
      return session;
    }

    // Default demo account offline fallback
    if (username === 'demo' && password === 'demo123') {
      const demoUser: User = {
        id: 'user_demo_local',
        username: 'demo',
        displayName: 'Demo User',
        createdAt: new Date().toISOString(),
      };
      const session: AuthSession = { user: demoUser, isGuest: false };
      this.setSession(session);
      return session;
    }

    throw new Error('Invalid username or password');
  },

  async register(credentials: RegisterCredentials): Promise<AuthSession> {
    const username = credentials.username.trim().toLowerCase();
    const password = credentials.password;
    const displayName = (credentials.displayName || username).trim();

    if (!username || password.length < 4) {
      throw new Error('Username required and password must be at least 4 characters');
    }

    // Try backend API first
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName }),
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        const session: AuthSession = {
          user: data.user,
          token: data.token,
          isGuest: false,
        };
        this.setSession(session);
        return session;
      }

      if (res.status === 400) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Registration failed');
      }
    } catch (e: any) {
      if (e.message.includes('already exists') || e.message.includes('Registration failed')) {
        throw e;
      }
      console.warn('[AuthService] Backend unavailable, registering locally:', e.message);
    }

    // Offline / LocalStorage registration fallback
    const localUsers: LocalUserRecord[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
    if (localUsers.some((u) => u.user.username.toLowerCase() === username)) {
      throw new Error(`Username '${username}' is already taken`);
    }

    const newUser: User = {
      id: `user_local_${Date.now()}`,
      username,
      displayName,
      createdAt: new Date().toISOString(),
    };

    localUsers.push({
      user: newUser,
      passwordHash: clientHash(password),
    });
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));

    const session: AuthSession = {
      user: newUser,
      isGuest: false,
    };
    this.setSession(session);
    return session;
  },

  loginAsGuest(): AuthSession {
    const guestUser: User = {
      id: 'guest',
      username: 'guest',
      displayName: 'Guest Explorer',
      createdAt: new Date().toISOString(),
    };
    const session: AuthSession = {
      user: guestUser,
      isGuest: true,
    };
    this.setSession(session);
    return session;
  },

  logout(): void {
    this.clearSession();
  },
};
