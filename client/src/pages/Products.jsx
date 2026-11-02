import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import ProductModal from '../components/ProductModal';
import StockAdjustModal from '../components/StockAdjustModal';
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
} from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'LOW' | 'OUT' | 'HEALTHY'
  const [error, setError] = useState('');

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
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

  // Filter products by search and status
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
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
  }, [products, searchQuery, statusFilter]);

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
        <button
          onClick={() => {
            setSelectedProduct(null);
            setIsProductModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU or Product Name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
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
          <button
            onClick={fetchProducts}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition ml-2"
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
        ) : filteredProducts.length === 0 ? (
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
            {!searchQuery && (
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setIsProductModalOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Product</span>
              </button>
            )}
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
                {filteredProducts.map((p) => (
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
                        <span className="ml-1 text-[10px] text-slate-400">(org)</span>
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
                        <button
                          onClick={() => setAdjustingProduct(p)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Quick stock adjustment (+/-)"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>
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
