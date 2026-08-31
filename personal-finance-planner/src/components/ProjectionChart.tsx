import React, { useState } from 'react';
import { YearProjection } from '../engine/financeEngine';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

interface Props {
  projections: YearProjection[];
  retirementAge: number;
}

export const ProjectionChart: React.FC<Props> = ({ projections, retirementAge }) => {
  const [selectedAge, setSelectedAge] = useState<number>(retirementAge);

  const activeYearData = projections.find((p) => p.age === selectedAge) || projections[0];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  // Check for deficit depletion age
  const depletedYear = projections.find((p) => p.cash === 0 && p.growthInv === 0 && p.balanceInv === 0);

  return (
    <div className="glass-panel chart-panel">
      <div className="chart-header">
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 600 }}>60-Year Net Worth Trajectory</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Projection from Age {projections[0]?.age} to 100
          </p>
        </div>

        {depletedYear ? (
          <div className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={13} /> Depleted @ Age {depletedYear.age}
          </div>
        ) : (
          <div className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={13} /> Solvent to Age 100
          </div>
        )}
      </div>

      {/* Interactive Responsive Chart */}
      <div style={{ width: '100%', height: 320, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={projections}
            margin={{ top: 15, right: 10, left: -15, bottom: 5 }}
            onClick={(e) => {
              if (e && e.activeLabel) {
                setSelectedAge(Number(e.activeLabel));
              }
            }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="age" stroke="var(--text-dim)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <YAxis
              stroke="var(--text-dim)"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={48}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: 'rgba(255,255,255,0.15)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '12px',
                padding: '8px 10px',
              }}
              formatter={(val: number) => [formatCurrency(val)]}
              labelFormatter={(label) => `Age: ${label} ${Number(label) >= retirementAge ? '(Retired)' : ''}`}
            />
            <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px', color: 'var(--text-muted)' }} />

            <ReferenceLine
              x={retirementAge}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{ value: `Retire ${retirementAge}`, fill: '#f59e0b', fontSize: 10, position: 'top' }}
            />

            <Area type="monotone" dataKey="totalAssets" name="Net Worth" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" />
            <Line type="monotone" dataKey="k401k" name="401(k)" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="growthInv" name="Growth" stroke="#10b981" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="cash" name="Cash" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Age Scrubber Bar */}
      <div className="scrubber-bar">
        <Calendar size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Scrub Age:
            </span>
            <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', whiteSpace: 'nowrap' }}>
              Age {selectedAge} {activeYearData.isRetired ? '(Retired)' : '(Working)'}
            </span>
          </div>
          <input
            type="range"
            min={projections[0]?.age || 40}
            max={100}
            value={selectedAge}
            onChange={(e) => setSelectedAge(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Single-Year Inspection Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', width: '100%' }}>
        <div className="glass-panel" style={{ padding: '10px 12px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Income</span>
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-success)', whiteSpace: 'nowrap' }}>
            {formatCurrency(activeYearData.totalIncome)}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '10px 12px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Expenses + Tax</span>
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-danger)', whiteSpace: 'nowrap' }}>
            {formatCurrency(activeYearData.totalExpense)}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '10px 12px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Net Cash Flow</span>
          <p
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: activeYearData.deficit >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)',
              whiteSpace: 'nowrap',
            }}
          >
            {activeYearData.deficit >= 0 ? `+${formatCurrency(activeYearData.deficit)}` : formatCurrency(activeYearData.deficit)}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '10px 12px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Total Assets</span>
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-primary)', whiteSpace: 'nowrap' }}>
            {formatCurrency(activeYearData.totalAssets)}
          </p>
        </div>
      </div>
    </div>
  );
};
