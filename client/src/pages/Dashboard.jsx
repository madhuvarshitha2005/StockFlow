import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/Badge';
import StockAdjustModal from '../components/StockAdjustModal';
import StockHistoryModal from '../components/StockHistoryModal';
import ProductModal from '../components/ProductModal';
import {
  Package,
  Boxes,
  AlertTriangle,
  DollarSign,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  RefreshCw,
  Percent,
  History,
  AlertCircle,
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setError('Could not load dashboard data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleAdjustStock = async (productId, delta, note) => {
    await api.post(`/products/${productId}/adjust-stock`, { delta, note });
    await fetchDashboardStats();
  };

  const handleCreateProduct = async (payload) => {
    await api.post('/products', payload);
    await fetchDashboardStats();
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { summary, lowStockProducts, recentMovements } = stats || {
    summary: {
      totalProducts: 0,
      totalQuantity: 0,
      totalRetailValue: 0,
      totalCostValue: 0,
      potentialProfit: 0,
      profitMarginPct: 0,
      lowStockCount: 0,
      defaultLowStockThreshold: 5,
    },
    lowStockProducts: [],
    recentMovements: [],
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time stock levels, catalog valuations, and low inventory alerts for {summary.organizationName || 'your store'}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardStats}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Alert Banner for Low Stock */}
      {summary.lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-center justify-between gap-4 text-amber-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Immediate Action Recommended</p>
              <p className="text-sm font-medium text-amber-900">
                You have <span className="font-bold underline">{summary.lowStockCount} items</span> at or below their reorder threshold.
              </p>
            </div>
          </div>
          <a
            href="#low-stock-section"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-200/70 hover:bg-amber-200 text-xs font-bold text-amber-900 transition"
          >
            <span>Review Items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Products */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Products</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-slate-900">{summary.totalProducts}</p>
            <p className="text-xs text-slate-500 mt-1">Unique SKUs active</p>
          </div>
        </div>

        {/* Total Quantity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Units in Stock</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-slate-900">{summary.totalQuantity.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">Total physical units</p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock Alerts</span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                summary.lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <p
                className={`text-3xl font-black ${
                  summary.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {summary.lowStockCount}
              </p>
              {summary.lowStockCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Needs Attention
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">At or below threshold</p>
          </div>
        </div>

        {/* Estimated Valuation & Profit Margin */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catalog Valuation</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-slate-900">
              ${summary.totalRetailValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                {summary.profitMarginPct}% Margin
              </span>
              <span className="text-slate-400">• ${(summary.potentialProfit || 0).toLocaleString()} profit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Table Section (FR-6) */}
      <div id="low-stock-section" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden scroll-mt-6">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">Low Stock Items</h2>
              {lowStockProducts.length > 0 && (
                <Badge variant="warning">{lowStockProducts.length} requiring reorder</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Items whose quantity on hand is less than or equal to their threshold (Default: {summary.defaultLowStockThreshold} units).
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
          >
            <span>View all products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">All inventory levels are healthy!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No products are currently at or below their low-stock thresholds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Product</th>
                  <th className="py-3.5 px-6">SKU</th>
                  <th className="py-3.5 px-6">Quantity on Hand</th>
                  <th className="py-3.5 px-6">Threshold</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {lowStockProducts.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6 font-bold text-slate-900">{item.name}</td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.sku}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`font-black text-base ${
                          item.quantityOnHand === 0 ? 'text-rose-600' : 'text-amber-600'
                        }`}
                      >
                        {item.quantityOnHand} units
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs">
                      {item.effectiveThreshold} units
                      {item.lowStockThreshold === null && (
                        <span className="ml-1 text-[10px] text-slate-400">(org default)</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {item.quantityOnHand === 0 ? (
                        <Badge variant="danger">Out of Stock</Badge>
                      ) : (
                        <Badge variant="warning">Low Stock</Badge>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setHistoryProduct(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="View audit history"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setAdjustingProduct(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adjust Stock</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Stock Movements Feed */}
      {recentMovements && recentMovements.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-black text-slate-900">Recent Stock Activity Log</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentMovements.map((move) => (
              <div key={move.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      move.quantityDelta > 0
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {move.quantityDelta > 0 ? `+${move.quantityDelta}` : move.quantityDelta}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {move.product?.name || 'Product'}
                      <span className="ml-2 font-mono text-[11px] font-normal text-slate-400">
                        {move.product?.sku}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {move.note || 'Stock adjustment'} • by {move.adjustedBy || 'Admin'}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="font-semibold text-slate-700">
                    {move.previousQuantity} → {move.newQuantity} units
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {new Date(move.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <StockAdjustModal
        isOpen={!!adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        product={adjustingProduct}
        onAdjust={handleAdjustStock}
      />

      <StockHistoryModal
        isOpen={!!historyProduct}
        onClose={() => setHistoryProduct(null)}
        product={historyProduct}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={null}
        onSave={handleCreateProduct}
      />
    </div>
  );
};

export default Dashboard;
