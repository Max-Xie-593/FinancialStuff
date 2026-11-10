import React, { useState } from 'react';
import { Account, HoldingCalculated } from '../../types/investment';
import { Shield, Plus, Wallet, Trash2 } from 'lucide-react';

interface AccountsManagerProps {
  accounts: Account[];
  holdings: HoldingCalculated[];
  onAddAccount: (account: Account) => void;
  onDeleteAccount: (accountId: string) => void;
}

export const AccountsManager: React.FC<AccountsManagerProps> = ({
  accounts,
  holdings,
  onAddAccount,
  onDeleteAccount,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('Taxable');
  const [description, setDescription] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newAcc: Account = {
      id: `acc_${Date.now()}`,
      name: name.trim(),
      type,
      description: description.trim() || undefined,
    };

    onAddAccount(newAcc);
    setName('');
    setDescription('');
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Privacy & Multi-Account Explainer */}
      <div className="glass-panel info-banner">
        <div className="info-banner-icon">
          <Shield size={24} className="text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-main">Multi-Account & Tax-Lot Management</h3>
          <p className="text-sm text-muted">
            Manage multiple brokerage accounts, retirement buckets (Roth IRA, 401k), or individual family member portfolios.
            All accounts share unified market quotes while maintaining independent cost bases, lot dates, and balances.
          </p>
        </div>
      </div>

      {/* Add New Account Card */}
      <div className="glass-panel p-6">
        <h4 className="font-bold text-main mb-4 flex items-center gap-2">
          <Plus size={18} className="text-primary" />
          Create New Portfolio Account
        </h4>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="form-group">
            <label className="form-label">Account Name *</label>
            <input
              type="text"
              placeholder="e.g. Traditional 401(k), Person B Brokerage"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Account Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Account['type'])}
              className="form-select"
            >
              <option value="Taxable">Taxable Brokerage</option>
              <option value="Roth IRA">Roth IRA</option>
              <option value="Traditional 401(k)">Traditional 401(k)</option>
              <option value="Personal">Personal / Family</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Fidelity primary retirement bucket"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <button type="submit" className="btn btn-primary w-full">
              <Plus size={16} />
              <span>Create Account</span>
            </button>
          </div>
        </form>
      </div>

      {/* Accounts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {accounts.map((acc) => {
          const accHoldings = holdings.filter((h) => h.accountId === acc.id);
          const totalValue = accHoldings.reduce((sum, h) => sum + h.currentValue, 0);
          const totalCost = accHoldings.reduce((sum, h) => sum + h.costBasis, 0);
          const gain = totalValue - totalCost;
          const gainPct = totalCost > 0 ? (gain / totalCost) * 100 : 0;
          const isGain = gain >= 0;

          return (
            <div key={acc.id} className="glass-panel p-5 relative">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="stat-icon-wrapper bg-blue-subtle">
                    <Wallet size={18} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-main">{acc.name}</h4>
                    <span className="pill pill-primary text-xs">{acc.type}</span>
                  </div>
                </div>

                {accounts.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(`Delete account "${acc.name}" and all its recorded positions?`)) {
                        onDeleteAccount(acc.id);
                      }
                    }}
                    className="btn-icon-delete"
                    title="Delete account"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {acc.description && (
                <p className="text-xs text-muted mb-4">{acc.description}</p>
              )}

              <div className="border-t border-card pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Total Value</span>
                  <span className="font-mono font-bold text-main">{formatCurrency(totalValue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Cost Basis</span>
                  <span className="font-mono text-muted">{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Unrealized P/L</span>
                  <span className={`font-mono font-bold ${isGain ? 'text-success' : 'text-danger'}`}>
                    {isGain ? '+' : ''}{formatCurrency(gain)} ({gainPct.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Lots Tracked</span>
                  <span className="font-mono text-cyan">{accHoldings.length} Positions</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
