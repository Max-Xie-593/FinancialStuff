import React, { useState } from 'react';
import { YearProjection } from '../engine/financeEngine';
import { Table, Search, Download, HelpCircle } from 'lucide-react';

interface Props {
  projections: YearProjection[];
}

export const YearlyLedger: React.FC<Props> = ({ projections }) => {
  const [searchAge, setSearchAge] = useState<string>('');
  const [showHelper, setShowHelper] = useState<boolean>(false);

  const filtered = projections.filter((p) => {
    if (!searchAge) return true;
    return p.age.toString().includes(searchAge);
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const hasOtherAssets = projections.some((p) => p.edu > 0 || p.property > 0);

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
      'Cash Savings',
      'Growth Inv',
      'Balanced Inv',
      '401k / IRA',
      'Other Assets (Property/Edu)',
      'Total Net Assets',
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
      (p.k401k + p.roth).toFixed(0),
      (p.edu + p.property).toFixed(0),
      p.totalAssets.toFixed(0),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_projection_age_${projections[0]?.age || 40}_to_100.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel chart-panel">
      <div className="chart-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Table size={18} color="var(--accent-primary)" /> Annual Financial Ledger
            </h2>
            <button
              onClick={() => setShowHelper(!showHelper)}
              style={{
                background: 'none',
                border: 'none',
                color: showHelper ? 'var(--accent-primary)' : 'var(--text-dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="How do columns add up?"
            >
              <HelpCircle size={15} />
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Annual cash flow & asset balance log (Age {projections[0]?.age || 40} to 100)
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

      {/* Math Explanation Helper Box */}
      {showHelper && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: 'var(--accent-cyan)' }}>How columns add up to Total Net Assets:</strong>
          <ul style={{ paddingLeft: '18px', marginTop: '6px' }}>
            <li>
              <strong>Total Net Assets</strong> = <span style={{ color: '#fff' }}>Cash</span> +{' '}
              <span style={{ color: '#fff' }}>Growth</span> +{' '}
              <span style={{ color: '#fff' }}>Balanced</span> +{' '}
              <span style={{ color: '#fff' }}>401(k) / Roth</span>
              {hasOtherAssets ? ' + Other Assets (Property/Edu)' : ''}.
            </li>
            <li>
              <strong>Year 1 (Starting Age):</strong> Displays your starting asset basis. The <em>Net Flow</em> (+$24,975) earned during this year compounds into your Cash & Investments starting in Year 2 (Age 41).
            </li>
          </ul>
        </div>
      )}

      <div className="ledger-container" style={{ maxHeight: '480px', overflowY: 'auto' }}>
        <table className="ledger-table">
          <thead>
            <tr>
              <th style={{ width: '45px' }}>Age</th>
              <th style={{ width: '55px' }}>Status</th>
              <th>Income</th>
              <th>Taxes</th>
              <th>Expenses</th>
              <th>Net Flow</th>
              <th>Cash</th>
              <th>Growth</th>
              <th>Balanced</th>
              <th>401(k)/Roth</th>
              {hasOtherAssets && <th>Other Assets</th>}
              <th style={{ color: 'var(--accent-primary)', background: 'rgba(59, 130, 246, 0.15)' }}>
                Total Assets
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.age} className={p.isRetired ? 'retired-row' : ''}>
                <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--accent-cyan)' }}>{p.age}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className={p.isRetired ? 'badge-sm badge-warning' : 'badge-sm badge-success'}>
                    {p.isRetired ? 'Retire' : 'Work'}
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
                <td>{formatCurrency(p.balanceInv)}</td>
                <td>{formatCurrency(p.k401k + p.roth)}</td>
                {hasOtherAssets && <td>{formatCurrency(p.edu + p.property)}</td>}
                <td style={{ fontWeight: 700, color: 'var(--accent-primary)', background: 'rgba(59, 130, 246, 0.08)' }}>
                  {formatCurrency(p.totalAssets)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
