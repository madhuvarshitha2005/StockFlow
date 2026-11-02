import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import ProductModal from '../components/ProductModal';
import StockAdjustModal from '../components/StockAdjustModal';
import StockHistoryModal from '../components/StockHistoryModal';
import ConfirmModal from '../components/ConfirmModal';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Package,
  Layers,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Download,
  History,
  ArrowUpDown,
} from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'LOW' | 'OUT' | 'HEALTHY'
  const [sortBy, setSortBy] = useState('updated'); // 'updated' | 'qty_asc' | 'qty_desc' | 'name_asc' | 'price_desc'
  const [error, setError] = useState('');

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data.products || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter and sort products
  const processedProducts = useMemo(() => {
    let result = products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === 'LOW') return p.isLowStock && p.quantityOnHand > 0;
      if (statusFilter === 'OUT') return p.quantityOnHand === 0;
      if (statusFilter === 'HEALTHY') return !p.isLowStock && p.quantityOnHand > 0;
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'qty_asc') return a.quantityOnHand - b.quantityOnHand;
      if (sortBy === 'qty_desc') return b.quantityOnHand - a.quantityOnHand;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'price_desc') return (b.sellingPrice || 0) - (a.sellingPrice || 0);
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });

    return result;
  }, [products, searchQuery, statusFilter, sortBy]);

  // Handlers
  const handleSaveProduct = async (payload, id) => {
    if (id) {
      await api.put(`/products/${id}`, payload);
    } else {
      await api.post('/products', payload);
    }
    await fetchProducts();
  };

  const handleAdjustStock = async (productId, delta, note) => {
    await api.post(`/products/${productId}/adjust-stock`, { delta, note });
    await fetchProducts();
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${deletingProduct.id}`);
      setDeletingProduct(null);
      await fetchProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
      setError(err.response?.data?.error || 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  // CSV Export feature
  const handleExportCSV = () => {
    if (products.length === 0) return;

    const headers = [
      'SKU',
      'Name',
      'Description',
      'Quantity on Hand',
      'Status',
      'Low Stock Threshold',
      'Cost Price ($)',
      'Selling Price ($)',
      'Total Cost Valuation ($)',
      'Total Retail Valuation ($)',
      'Last Updated By',
    ];

    const rows = processedProducts.map((p) => {
      const status = p.quantityOnHand === 0 ? 'Out of Stock' : p.isLowStock ? 'Low Stock' : 'In Stock';
      const costVal = (p.costPrice || 0) * p.quantityOnHand;
      const retailVal = (p.sellingPrice || 0) * p.quantityOnHand;

      return [
        `"${p.sku}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${(p.description || '').replace(/"/g, '""')}"`,
        p.quantityOnHand,
        `"${status}"`,
        p.effectiveThreshold,
        (p.costPrice || 0).toFixed(2),
        (p.sellingPrice || 0).toFixed(2),
        costVal.toFixed(2),
        retailVal.toFixed(2),
        `"${p.lastUpdatedBy || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `StockFlow_Inventory_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your items, SKUs, inventory counts, and price tiers.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition"
            title="Download CSV Inventory Report"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setSelectedProduct(null);
              setIsProductModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search, Sort and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU or Product Name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
        </div>

        {/* Filter Pills & Sorting */}
        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 justify-between lg:justify-end">
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { label: 'All Items', value: 'ALL' },
              { label: 'Low Stock', value: 'LOW' },
              { label: 'Out of Stock', value: 'OUT' },
              { label: 'Healthy', value: 'HEALTHY' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === tab.value
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-slate-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="updated">Recently Updated</option>
              <option value="qty_asc">Lowest Stock First</option>
              <option value="qty_desc">Highest Stock First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="price_desc">Highest Price</option>
            </select>
          </div>

          <button
            onClick={fetchProducts}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition shrink-0"
            title="Refresh catalog"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Table (FR-4) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : processedProducts.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {searchQuery ? 'No matching products found' : 'No products in inventory yet'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search query or clear the filter.'
                : 'Click "Add Product" to create your first inventory item.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Product & SKU</th>
                  <th className="py-3.5 px-6">Quantity on Hand</th>
                  <th className="py-3.5 px-6">Threshold</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Cost Price</th>
                  <th className="py-3.5 px-6">Selling Price</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {processedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                          {p.sku}
                        </span>
                        {p.description && (
                          <span className="text-xs text-slate-400 truncate max-w-xs" title={p.description}>
                            {p.description}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-base ${
                            p.quantityOnHand === 0
                              ? 'text-rose-600'
                              : p.isLowStock
                              ? 'text-amber-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {p.quantityOnHand}
                        </span>
                        <span className="text-xs text-slate-400">units</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-600 text-xs">
                      {p.effectiveThreshold}
                      {p.lowStockThreshold === null && (
                        <span className="ml-1 text-[10px] text-slate-400">(org default)</span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      {p.quantityOnHand === 0 ? (
                        <Badge variant="danger">Out of Stock</Badge>
                      ) : p.isLowStock ? (
                        <Badge variant="warning">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </td>

                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {p.costPrice !== null && p.costPrice !== undefined ? `$${p.costPrice.toFixed(2)}` : '—'}
                    </td>

                    <td className="py-4 px-6 text-slate-900 font-bold">
                      {p.sellingPrice !== null && p.sellingPrice !== undefined ? `$${p.sellingPrice.toFixed(2)}` : '—'}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick stock adjustment */}
                        <button
                          onClick={() => setAdjustingProduct(p)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Quick stock adjustment (+/-)"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>

                        {/* Movement history audit */}
                        <button
                          onClick={() => setHistoryProduct(p)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="View movement history / audit log"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Edit product */}
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setIsProductModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete product */}
                        <button
                          onClick={() => setDeletingProduct(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        onSave={handleSaveProduct}
      />

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

      <ConfirmModal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message={`Are you sure you want to permanently delete "${deletingProduct?.name}" (${deletingProduct?.sku})? This action cannot be undone.`}
        confirmText="Confirm Delete"
        loading={deleting}
      />
    </div>
  );
};

export default Products;
