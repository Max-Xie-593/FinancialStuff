import React from 'react';
import { FinancialInputs, ExpenseCategories } from '../engine/financeEngine';
import { Wallet, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  inputs: FinancialInputs;
  onChange: (updated: FinancialInputs) => void;
}

export const BudgetEnvelope: React.FC<Props> = ({ inputs, onChange }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const monthlyIncome = inputs.annualIncome / 12;
  const categories = inputs.expenseCategories || {
    housing: 24000,
    food: 12000,
    utilities: 6000,
    healthcare: 4800,
    travel: 5300,
    insurance: 10000,
    misc: 18000,
  };

  const handleCategoryChange = (key: keyof ExpenseCategories, annualVal: number) => {
    const updatedCategories = {
      ...categories,
      [key]: annualVal,
    };

    // Recalculate annual sums
    const newAnnualLiving =
      updatedCategories.housing +
      updatedCategories.food +
      updatedCategories.utilities +
      updatedCategories.misc;

    onChange({
      ...inputs,
      expenseCategories: updatedCategories,
      annualExpense: newAnnualLiving,
      travelExpense: updatedCategories.travel,
      medicalInsurance: updatedCategories.healthcare,
      lifeInsurancePremium: updatedCategories.insurance,
    });
  };

  // Groupings for 50/30/20 Rule
  const monthlyNeeds = (categories.housing + categories.food + categories.utilities + categories.healthcare) / 12;
  const monthlyWants = (categories.travel + categories.misc) / 12;
  const monthlyInsurance = categories.insurance / 12;
  const totalMonthlyExpenses = monthlyNeeds + monthlyWants + monthlyInsurance;
  const monthlySurplus = monthlyIncome - totalMonthlyExpenses;

  const pctNeeds = (monthlyNeeds / monthlyIncome) * 100;
  const pctWants = (monthlyWants / monthlyIncome) * 100;
  const pctSavings = (monthlySurplus / monthlyIncome) * 100;

  return (
    <div className="glass-panel chart-panel">
      <div className="chart-header">
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={18} color="var(--accent-success)" /> Expense Budget Planner
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Adjust monthly envelopes to shape long-term cash flow
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Monthly Gross Income</span>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
            {formatCurrency(monthlyIncome)}/mo
          </p>
        </div>
      </div>

      {/* 50 / 30 / 20 Visual Gauge */}
      <div className="glass-panel" style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.9)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
            50/30/20 Budget Adherence
          </h3>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {pctNeeds <= 50 ? (
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={12} /> Needs ({pctNeeds.toFixed(0)}%)
              </span>
            ) : (
              <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={12} /> High Needs ({pctNeeds.toFixed(0)}%)
              </span>
            )}
            {pctSavings >= 20 ? (
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={12} /> Savings ({pctSavings.toFixed(0)}%)
              </span>
            ) : (
              <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={12} /> Low Savings ({pctSavings.toFixed(0)}%)
              </span>
            )}
          </div>
        </div>

        {/* Stacked Progress Bar */}
        <div style={{ height: '12px', width: '100%', borderRadius: '6px', display: 'flex', overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
          <div
            title={`Needs: ${pctNeeds.toFixed(1)}%`}
            style={{ width: `${Math.min(100, Math.max(0, pctNeeds))}%`, background: 'var(--accent-primary)', transition: 'width 0.2s' }}
          />
          <div
            title={`Wants: ${pctWants.toFixed(1)}%`}
            style={{ width: `${Math.min(100, Math.max(0, pctWants))}%`, background: 'var(--accent-purple)', transition: 'width 0.2s' }}
          />
          <div
            title={`Savings: ${pctSavings.toFixed(1)}%`}
            style={{ width: `${Math.min(100, Math.max(0, pctSavings))}%`, background: 'var(--accent-success)', transition: 'width 0.2s' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '8px', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '6px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
            Needs ({formatCurrency(monthlyNeeds)}/mo)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-purple)' }} />
            Wants ({formatCurrency(monthlyWants)}/mo)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-success)' }} />
            Savings ({formatCurrency(monthlySurplus)}/mo)
          </span>
        </div>
      </div>

      {/* Editable Category Sliders Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', width: '100%' }}>
        {/* Housing */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div className="input-header">
            <span>Housing</span>
            <span className="input-value">{formatCurrency(categories.housing / 12)}/mo</span>
          </div>
          <input
            type="range"
            min={6000}
            max={72000}
            step={1200}
            value={categories.housing}
            onChange={(e) => handleCategoryChange('housing', Number(e.target.value))}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{formatCurrency(categories.housing)} / year</span>
        </div>

        {/* Food & Groceries */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div className="input-header">
            <span>Food & Groceries</span>
            <span className="input-value">{formatCurrency(categories.food / 12)}/mo</span>
          </div>
          <input
            type="range"
            min={2400}
            max={36000}
            step={600}
            value={categories.food}
            onChange={(e) => handleCategoryChange('food', Number(e.target.value))}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{formatCurrency(categories.food)} / year</span>
        </div>

        {/* Utilities & Internet */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div className="input-header">
            <span>Utilities & Internet</span>
            <span className="input-value">{formatCurrency(categories.utilities / 12)}/mo</span>
          </div>
          <input
            type="range"
            min={1200}
            max={18000}
            step={300}
            value={categories.utilities}
            onChange={(e) => handleCategoryChange('utilities', Number(e.target.value))}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{formatCurrency(categories.utilities)} / year</span>
        </div>

        {/* Healthcare & Medical */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div className="input-header">
            <span>Medical Insurance</span>
            <span className="input-value">{formatCurrency(categories.healthcare / 12)}/mo</span>
          </div>
          <input
            type="range"
            min={1200}
            max={24000}
            step={600}
            value={categories.healthcare}
            onChange={(e) => handleCategoryChange('healthcare', Number(e.target.value))}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{formatCurrency(categories.healthcare)} / year</span>
        </div>

        {/* Travel & Vacation */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div className="input-header">
            <span>Travel & Leisure</span>
            <span className="input-value">{formatCurrency(categories.travel / 12)}/mo</span>
          </div>
          <input
            type="range"
            min={0}
            max={30000}
            step={500}
            value={categories.travel}
            onChange={(e) => handleCategoryChange('travel', Number(e.target.value))}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{formatCurrency(categories.travel)} / year</span>
        </div>

        {/* Life Insurance & Protection */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div className="input-header">
            <span>Life Insurance</span>
            <span className="input-value">{formatCurrency(categories.insurance / 12)}/mo</span>
          </div>
          <input
            type="range"
            min={0}
            max={30000}
            step={500}
            value={categories.insurance}
            onChange={(e) => handleCategoryChange('insurance', Number(e.target.value))}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{formatCurrency(categories.insurance)} / year</span>
        </div>

        {/* Miscellaneous / Discretionary */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div className="input-header">
            <span>Miscellaneous</span>
            <span className="input-value">{formatCurrency(categories.misc / 12)}/mo</span>
          </div>
          <input
            type="range"
            min={0}
            max={40000}
            step={1000}
            value={categories.misc}
            onChange={(e) => handleCategoryChange('misc', Number(e.target.value))}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{formatCurrency(categories.misc)} / year</span>
        </div>
      </div>
    </div>
  );
};
