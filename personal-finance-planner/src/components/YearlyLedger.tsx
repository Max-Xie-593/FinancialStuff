import React, { useState } from 'react';
import { YearProjection } from '../engine/financeEngine';
import { Table, Search, Download } from 'lucide-react';

interface Props {
  projections: YearProjection[];
}

export const YearlyLedger: React.FC<Props> = ({ projections }) => {
  const [searchAge, setSearchAge] = useState<string>('');

  const filtered = projections.filter((p) => {
    if (!searchAge) return true;
    return p.age.toString().includes(searchAge);
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const exportCSV = () => {
    const headers = [
      'Age',
      'Status',
      'Earned Income',
      'Social Security',
      'Total Income',
      'Income Tax',
      'Living Expense',
      'Total Expense',
      'Deficit/Surplus',
      'Cash',
      'Growth Inv',
      'Balance Inv',
      '401k',
      'Roth',
      'Total Assets',
    ];

    const rows = projections.map((p) => [
      p.age,
      p.isRetired ? 'Retired' : 'Working',
      p.earnedIncome.toFixed(0),
      (p.ssA + p.ssB).toFixed(0),
      p.totalIncome.toFixed(0),
      p.incomeTax.toFixed(0),
      p.otherExpenses.toFixed(0),
      p.totalExpense.toFixed(0),
      p.deficit.toFixed(0),
      p.cash.toFixed(0),
      p.growthInv.toFixed(0),
      p.balanceInv.toFixed(0),
      p.k401k.toFixed(0),
      p.roth.toFixed(0),
      p.totalAssets.toFixed(0),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', '60_year_financial_projection.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel chart-panel">
      <div className="chart-header">
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Table size={18} color="var(--accent-primary)" /> 60-Year Financial Ledger
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Annual cash flow & asset balance log
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '300px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: '100px' }}>
            <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text"
              placeholder="Search age..."
              value={searchAge}
              onChange={(e) => setSearchAge(e.target.value)}
              style={{
                paddingLeft: '28px',
                height: '32px',
                borderRadius: '8px',
                fontSize: '12px',
                width: '100%',
              }}
            />
          </div>

          <button
            onClick={exportCSV}
            className="tab-btn"
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--accent-primary)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '6px 12px',
              fontSize: '12px',
            }}
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      <div className="ledger-container" style={{ maxHeight: '480px', overflowY: 'auto' }}>
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Age</th>
              <th>Status</th>
              <th>Total Income</th>
              <th>Tax Paid</th>
              <th>Total Expense</th>
              <th>Net Surplus / Deficit</th>
              <th>Cash Savings</th>
              <th>Growth Inv</th>
              <th>401(k) / IRA</th>
              <th>Total Net Assets</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.age} className={p.isRetired ? 'retired-row' : ''}>
                <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--accent-cyan)' }}>{p.age}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className={p.isRetired ? 'badge badge-warning' : 'badge badge-success'}>
                    {p.isRetired ? 'Retired' : 'Working'}
                  </span>
                </td>
                <td style={{ color: 'var(--accent-success)' }}>{formatCurrency(p.totalIncome)}</td>
                <td style={{ color: 'var(--text-muted)' }}>{formatCurrency(p.incomeTax)}</td>
                <td style={{ color: 'var(--accent-danger)' }}>{formatCurrency(p.totalExpense)}</td>
                <td style={{ fontWeight: 600, color: p.deficit >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                  {p.deficit >= 0 ? `+${formatCurrency(p.deficit)}` : formatCurrency(p.deficit)}
                </td>
                <td>{formatCurrency(p.cash)}</td>
                <td>{formatCurrency(p.growthInv)}</td>
                <td>{formatCurrency(p.k401k + p.roth)}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{formatCurrency(p.totalAssets)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
