import React, { useState, useEffect } from 'react';
import { Lock, Delete, ShieldAlert, Sparkles } from 'lucide-react';
import { pinSecurityService } from '../../services/pinSecurityService';

interface Props {
  onUnlock: () => void;
}

export const PinLockScreen: React.FC<Props> = ({ onUnlock }) => {
  const [pin, setPin] = useState<string>('');
  const [errorShake, setErrorShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle number click
  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMsg('');

    // Vibrate haptic if supported
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }

    // Auto-check when reaching 4 or 6 digits
    if (newPin.length >= 4) {
      if (pinSecurityService.verifyPin(newPin)) {
        onUnlock();
      } else if (newPin.length === 6) {
        // Failed at 6
        triggerError();
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const triggerError = () => {
    setErrorShake(true);
    setErrorMsg('Incorrect PIN. Please try again.');
    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    setTimeout(() => {
      setPin('');
      setErrorShake(false);
    }, 600);
  };

  // Keyboard support for desktop testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="pin-lock-container">
      <div className="pin-lock-card">
        <div className="pin-lock-icon">
          <Lock size={32} />
        </div>
        <h2 className="pin-title">Financial Suite</h2>
        <p className="pin-subtitle">Enter your security PIN to unlock</p>

        {/* PIN Indicators (Dots) */}
        <div className={`pin-dots ${errorShake ? 'shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`pin-dot ${pin.length > index ? 'filled' : ''}`}
            />
          ))}
          {pin.length > 4 && (
            <div className={`pin-dot ${pin.length > 4 ? 'filled' : ''}`} />
          )}
          {pin.length > 5 && (
            <div className={`pin-dot ${pin.length > 5 ? 'filled' : ''}`} />
          )}
        </div>

        {errorMsg && <div className="pin-error-text">{errorMsg}</div>}

        {/* Keypad */}
        <div className="pin-keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              className="keypad-btn"
              onClick={() => handleDigit(digit)}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            className="keypad-btn action-btn"
            onClick={handleClear}
          >
            Clear
          </button>
          <button
            type="button"
            className="keypad-btn"
            onClick={() => handleDigit('0')}
          >
            0
          </button>
          <button
            type="button"
            className="keypad-btn action-btn"
            onClick={handleDelete}
          >
            <Delete size={22} />
          </button>
        </div>

        <div className="pin-footer-hint">
          <Sparkles size={14} style={{ display: 'inline', marginRight: 4 }} />
          Local encrypted lock protecting your financial portfolio
        </div>
      </div>
    </div>
  );
};
