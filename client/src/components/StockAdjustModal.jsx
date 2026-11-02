import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { AlertCircle, Plus, Minus } from 'lucide-react';

const StockAdjustModal = ({ isOpen, onClose, product, onAdjust }) => {
  const [delta, setDelta] = useState(1);
  const [direction, setDirection] = useState('add'); // 'add' or 'remove'
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setDelta(1);
    setDirection('add');
    setNote('');
    setError('');
  }, [product, isOpen]);

  if (!product) return null;

  const currentQty = product.quantityOnHand ?? 0;
  const numericDelta = parseInt(delta, 10) || 0;
  const effectiveDelta = direction === 'add' ? numericDelta : -numericDelta;
  const projectedQty = currentQty + effectiveDelta;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (numericDelta <= 0) {
      setError('Adjustment amount must be greater than zero.');
      return;
    }

    if (projectedQty < 0) {
      setError(`Cannot reduce stock below 0. Maximum reduction possible is ${currentQty} units.`);
      return;
    }

    setSubmitting(true);
    try {
      await onAdjust(product.id, effectiveDelta, note);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to adjust stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Stock Adjustment"
      subtitle={`Product: ${product.name} (${product.sku})`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Current Stock Preview Card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Current Stock</p>
            <p className="text-2xl font-black text-slate-800">{currentQty} units</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500">Projected Stock</p>
            <p
              className={`text-2xl font-black ${
                projectedQty < 0
                  ? 'text-rose-600'
                  : projectedQty <= (product.effectiveThreshold ?? 5)
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {projectedQty} units
            </p>
          </div>
        </div>

        {/* Direction Switcher */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Adjustment Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection('add')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition border ${
                direction === 'add'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Plus className="w-4 h-4" />
              Restock (+ Units)
            </button>
            <button
              type="button"
              onClick={() => setDirection('remove')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition border ${
                direction === 'remove'
                  ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Minus className="w-4 h-4" />
              Deduct (- Units)
            </button>
          </div>
        </div>

        {/* Units Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Number of Units
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              required
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
            {/* Quick buttons */}
            {[5, 10, 25].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setDelta(amt)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Adjustment Note */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Reason / Note (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Supplier delivery, damaged unit, inventory count"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || projectedQty < 0}
            className={`px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition disabled:opacity-50 ${
              direction === 'add'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
            }`}
          >
            {submitting ? 'Updating...' : `Confirm ${direction === 'add' ? 'Addition' : 'Deduction'}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StockAdjustModal;
