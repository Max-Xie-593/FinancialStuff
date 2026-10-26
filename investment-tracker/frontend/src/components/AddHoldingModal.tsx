import React, { useState } from 'react';
import { Account, AssetCategory, HoldingLot } from '../types/investment';
import { KNOWN_METADATA } from '../engine/portfolioEngine';
import { X, PlusCircle } from 'lucide-react';

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  defaultAccountId: string;
  onSave: (holding: HoldingLot) => void;
}

export const AddHoldingModal: React.FC<AddHoldingModalProps> = ({
  isOpen,
  onClose,
  accounts,
  defaultAccountId,
  onSave,
}) => {
  const [accountId, setAccountId] = useState(defaultAccountId === 'ALL' ? accounts[0]?.id || '' : defaultAccountId);
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('Stock');
  const [shares, setShares] = useState<string>('');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sector, setSector] = useState('');
  const [industry, setIndustry] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSymbolChange = (val: string) => {
    setSymbol(val);
    const upper = val.trim().toUpperCase();
    const known = KNOWN_METADATA[upper];
    if (known) {
      if (!name) setName(known.name || '');
      if (!sector) setSector(known.sector || '');
      if (!industry) setIndustry(known.industry || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numShares = parseFloat(shares);
    const numPrice = parseFloat(purchasePrice);

    if (!symbol.trim() || isNaN(numShares) || numShares <= 0 || isNaN(numPrice) || numPrice < 0) {
      alert('Please enter a valid Symbol, positive number of shares, and purchase price.');
      return;
    }

    const newLot: HoldingLot = {
      id: `lot-${Date.now()}`,
      accountId: accountId || accounts[0]?.id || 'acc_default',
      symbol: symbol.trim().toUpperCase(),
      name: name.trim() || undefined,
      category,
      shares: numShares,
      purchasePrice: numPrice,
      purchaseDate,
      sector: sector.trim() || undefined,
      industry: industry.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSave(newLot);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="glass-panel modal-card">
        <div className="modal-header">
          <div className="modal-title-group">
            <PlusCircle size={20} className="text-primary" />
            <h3 className="modal-title">Record Holding Lot</h3>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Target Account */}
          <div className="form-group">
            <label className="form-label">Portfolio Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="form-select"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row-2">
            {/* Ticker Symbol */}
            <div className="form-group">
              <label className="form-label">Ticker Symbol *</label>
              <input
                type="text"
                placeholder="e.g. AAPL, VOO, FZROX"
                value={symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="form-input"
                required
                autoFocus
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Asset Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="form-select"
              >
                <option value="Stock">Stock</option>
                <option value="Dividend">High Dividend Stock</option>
                <option value="Berkshire">Berkshire Portfolio</option>
                <option value="ETF">ETF</option>
                <option value="MutualFund">Mutual Fund</option>
              </select>
            </div>
          </div>

          <div className="form-row-2">
            {/* Shares */}
            <div className="form-group">
              <label className="form-label">Shares Quantity *</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 100"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="form-input"
                required
              />
            </div>

            {/* Purchase Price */}
            <div className="form-group">
              <label className="form-label">Purchase Price ($) *</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 150.50"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            {/* Purchase Date */}
            <div className="form-group">
              <label className="form-label">Purchase Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Company / Asset Name (Optional) */}
            <div className="form-group">
              <label className="form-label">Company Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Apple Inc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row-2">
            {/* Sector (Optional) */}
            <div className="form-group">
              <label className="form-label">Sector (Optional)</label>
              <input
                type="text"
                placeholder="Auto-detected or e.g. Technology"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Industry (Optional) */}
            <div className="form-group">
              <label className="form-label">Industry (Optional)</label>
              <input
                type="text"
                placeholder="Auto-detected or e.g. Semiconductors"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Dollar cost averaging lot 1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input"
            />
          </div>


          {/* Modal Actions */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Holding Lot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
