import React, { useState } from 'react';
import { authService } from '../services/authService';
import { AuthSession } from '../types/auth';
import { Lock, User, UserPlus, LogIn, Sparkles, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (session: AuthSession) => void;
  canDismiss?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  canDismiss = false,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const session = await authService.login({ username, password });
      onSuccess(session);
      onClose?.();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const session = await authService.register({ username, password, displayName });
      onSuccess(session);
      onClose?.();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    const session = authService.loginAsGuest();
    onSuccess(session);
    onClose?.();
  };

  return (
    <div className="modal-backdrop">
      <div className="glass-panel modal-card auth-modal-card">
        {/* Modal Header */}
        <div className="auth-header">
          <div className="brand-icon-wrapper auth-icon-wrapper">
            <Lock size={22} className="text-white" />
          </div>
          <h2 className="auth-title">Investment Tracker Account</h2>
          <p className="auth-subtitle">Sign in to sync your portfolio or create a new account</p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); }}
            className={`auth-tab ${tab === 'login' ? 'auth-tab-active' : ''}`}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); }}
            className={`auth-tab ${tab === 'register' ? 'auth-tab-active' : ''}`}
          >
            <UserPlus size={15} />
            <span>Create Account</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  placeholder="e.g. demo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full btn-auth">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="auth-demo-hint">
              <span>Quick test account: <code>demo</code> / <code>demo123</code></span>
            </div>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label className="form-label">Username *</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  placeholder="e.g. alice"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Display Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Alice Smith"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  placeholder="Min 4 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full btn-auth">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Footer actions */}
        <div className="auth-modal-footer">
          <button type="button" onClick={handleGuest} className="btn-link-guest">
            <Sparkles size={14} className="text-purple" />
            <span>Continue as Guest (Offline)</span>
          </button>

          {canDismiss && onClose && (
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
