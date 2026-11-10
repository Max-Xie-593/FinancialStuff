/**
 * PIN Security Service
 * Handles user PIN setup, hashing, verification, auto-lock timeouts,
 * and visibilitychange privacy locking for the Mobile PWA.
 */

const PIN_STORAGE_KEY = 'fs_security_pin_hash';
const PIN_SALT_KEY = 'fs_security_pin_salt';
const PIN_ENABLED_KEY = 'fs_security_pin_enabled';
const PIN_TIMEOUT_KEY = 'fs_security_autolock_minutes';

export type AutoLockTimeout = 0 | 1 | 5 | 15 | 30; // 0 = Immediately when minimized

class PinSecurityService {
  private isLocked: boolean = false;
  private lastActiveTimestamp: number = Date.now();
  private subscribers: Array<(locked: boolean) => void> = [];

  constructor() {
    // If PIN is enabled, app boots in locked state
    if (this.isPinEnabled()) {
      this.isLocked = true;
    }

    // Set up user activity tracking
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', () => this.touchActivity());
      window.addEventListener('keydown', () => this.touchActivity());

      // Auto-lock when user leaves app or switches tab
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          const timeoutMin = this.getAutoLockTimeout();
          if (timeoutMin === 0 && this.isPinEnabled()) {
            this.lock();
          }
        } else if (document.visibilityState === 'visible') {
          this.checkInactivityLock();
        }
      });

      // Periodic check every 15 seconds
      setInterval(() => {
        this.checkInactivityLock();
      }, 15000);
    }
  }

  public touchActivity() {
    this.lastActiveTimestamp = Date.now();
  }

  private checkInactivityLock() {
    if (!this.isPinEnabled() || this.isLocked) return;

    const timeoutMinutes = this.getAutoLockTimeout();
    if (timeoutMinutes === 0) return;

    const elapsedMs = Date.now() - this.lastActiveTimestamp;
    if (elapsedMs >= timeoutMinutes * 60 * 1000) {
      this.lock();
    }
  }

  public subscribe(cb: (locked: boolean) => void): () => void {
    this.subscribers.push(cb);
    cb(this.isLocked);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  private notify() {
    this.subscribers.forEach((cb) => cb(this.isLocked));
  }

  public getIsLocked(): boolean {
    return this.isLocked;
  }

  public lock() {
    if (this.isPinEnabled()) {
      this.isLocked = true;
      this.notify();
    }
  }

  public isPinEnabled(): boolean {
    return localStorage.getItem(PIN_ENABLED_KEY) === 'true' && Boolean(localStorage.getItem(PIN_STORAGE_KEY));
  }

  public getAutoLockTimeout(): AutoLockTimeout {
    const saved = localStorage.getItem(PIN_TIMEOUT_KEY);
    if (!saved) return 5;
    return Number(saved) as AutoLockTimeout;
  }

  public setAutoLockTimeout(minutes: AutoLockTimeout) {
    localStorage.setItem(PIN_TIMEOUT_KEY, String(minutes));
  }

  // Simple, deterministic salt & hash implementation for client storage
  private simpleHash(pin: string, salt: string): string {
    let hash = 0;
    const combined = `${salt}_${pin}_financial_suite_secure`;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  public setPin(pin: string) {
    if (!/^\d{4,6}$/.test(pin)) {
      throw new Error('PIN must be 4 to 6 digits');
    }
    const salt = Math.random().toString(36).substring(2, 10);
    const hash = this.simpleHash(pin, salt);

    localStorage.setItem(PIN_SALT_KEY, salt);
    localStorage.setItem(PIN_STORAGE_KEY, hash);
    localStorage.setItem(PIN_ENABLED_KEY, 'true');

    this.isLocked = false;
    this.notify();
  }

  public disablePin(currentPin: string): boolean {
    if (!this.verifyPin(currentPin)) {
      return false;
    }
    localStorage.removeItem(PIN_STORAGE_KEY);
    localStorage.removeItem(PIN_SALT_KEY);
    localStorage.setItem(PIN_ENABLED_KEY, 'false');
    this.isLocked = false;
    this.notify();
    return true;
  }

  public verifyPin(enteredPin: string): boolean {
    const storedHash = localStorage.getItem(PIN_STORAGE_KEY);
    const salt = localStorage.getItem(PIN_SALT_KEY);
    if (!storedHash || !salt) return true; // No pin set

    const enteredHash = this.simpleHash(enteredPin, salt);
    if (enteredHash === storedHash) {
      this.isLocked = false;
      this.lastActiveTimestamp = Date.now();
      this.notify();
      return true;
    }
    return false;
  }
}

export const pinSecurityService = new PinSecurityService();
