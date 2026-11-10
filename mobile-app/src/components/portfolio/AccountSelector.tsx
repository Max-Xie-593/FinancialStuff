import React from 'react';
import { Account } from '../../types/investment';
import { Layers, Wallet, Plus } from 'lucide-react';

interface AccountSelectorProps {
  accounts: Account[];
  activeAccountId: string;
  onSelectAccount: (accountId: string) => void;
  onAddAccountClick: () => void;
  positionCountByAccount: Record<string, number>;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  accounts,
  activeAccountId,
  onSelectAccount,
  onAddAccountClick,
  positionCountByAccount,
}) => {
  const totalPositions = Object.values(positionCountByAccount).reduce((a, b) => a + b, 0);

  return (
    <div className="account-selector-bar">
      <div className="account-pills-list">
        {/* All Accounts Combined */}
        <button
          onClick={() => onSelectAccount('ALL')}
          className={`account-pill ${activeAccountId === 'ALL' ? 'account-pill-active' : ''}`}
        >
          <Layers size={15} />
          <span>All Accounts (Combined)</span>
          <span className="pill-count">{totalPositions}</span>
        </button>

        {/* Individual Accounts */}
        {accounts.map((acc) => {
          const count = positionCountByAccount[acc.id] || 0;
          return (
            <button
              key={acc.id}
              onClick={() => onSelectAccount(acc.id)}
              className={`account-pill ${activeAccountId === acc.id ? 'account-pill-active' : ''}`}
            >
              <Wallet size={15} />
              <span>{acc.name}</span>
              <span className="pill-type-tag">{acc.type}</span>
              <span className="pill-count">{count}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onAddAccountClick}
        className="btn btn-secondary btn-sm"
        title="Add a new sub-account (e.g., Roth IRA, 401(k), Partner Account)"
      >
        <Plus size={14} />
        <span>New Account</span>
      </button>
    </div>
  );
};
