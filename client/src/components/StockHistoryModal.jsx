import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { History, TrendingUp, TrendingDown, Clock, User, FileText, ArrowRight } from 'lucide-react';

const StockHistoryModal = ({ isOpen, onClose, product }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && product) {
      const fetchHistory = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/products/${product.id}/movements`);
          setMovements(res.data.movements || []);
          setError('');
        } catch (err) {
          console.error('Failed to fetch movement history:', err);
          setError('Could not load stock movement history.');
        } finally {
          setLoading(false);
        }
      };

      fetchHistory();
    }
  }, [isOpen, product]);

  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Audit & Movement History"
      subtitle={`Product: ${product.name} (${product.sku})`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Product Snapshot Bar */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Current On Hand</p>
            <p className="text-xl font-black text-slate-800">{product.quantityOnHand} units</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500">Recorded Adjustments</p>
            <p className="text-xl font-bold text-indigo-600">{movements.length} events</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Timeline */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : movements.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No stock adjustments recorded for this product yet.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto pr-1 space-y-3">
            {movements.map((m) => {
              const isPositive = m.quantityDelta > 0;
              const dateStr = new Date(m.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/60 transition flex items-start justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-extrabold ${
                        isPositive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-black ${
                            isPositive ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isPositive ? `+${m.quantityDelta}` : m.quantityDelta} units
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span>{m.previousQuantity}</span>
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                          <span className="font-bold text-slate-700">{m.newQuantity}</span>
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-800 mt-1">
                        {m.note || 'Manual Stock Adjustment'}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {dateStr}
                        </span>
                        {m.adjustedBy && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {m.adjustedBy}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default StockHistoryModal;
