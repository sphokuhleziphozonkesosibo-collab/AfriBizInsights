import React, { useState, useEffect } from 'react';
import { X, Boxes, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getAllProducts, updateProductStock, type Product } from '../services/api';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currency?: string;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currency = 'ZAR',
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currencySymbol = currency === 'ZAR' ? 'R' : currency;

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await getAllProducts();
      setProducts(data);
    } catch {
      setErrorMsg('Failed to load products from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (productId: string, val: string) => {
    const num = parseInt(val) || 0;
    setProducts((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, currentStock: Math.max(0, num) } : p))
    );
  };

  const handlePriceChange = (productId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setProducts((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, sellingPrice: Math.max(0, num) } : p))
    );
  };

  const handleSaveProduct = async (product: Product) => {
    try {
      setSavingId(product.productId);
      setErrorMsg(null);
      setSuccessMsg(null);

      await updateProductStock(product.productId, {
        currentStock: product.currentStock,
        reorderLevel: product.reorderLevel,
        sellingPrice: product.sellingPrice,
        costPrice: product.costPrice,
      });

      setSuccessMsg(`Updated inventory for ${product.name}!`);
      onSuccess();
    } catch {
      setErrorMsg(`Failed to update stock for ${product.name}`);
    } finally {
      setSavingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 relative border border-slate-100 max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Inventory & Stock Manager</h3>
            <p className="text-xs text-slate-500">Adjust on-hand shelf inventory and selling prices directly</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Product Table */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading inventory catalog...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No products found. Import a sales CSV to auto-generate your catalog.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Current Stock</th>
                  <th className="py-3 px-3">Selling Price</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {products.map((p) => (
                  <tr key={p.productId} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-bold text-slate-900 truncate max-w-[200px]">
                      {p.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="0"
                        value={p.currentStock}
                        onChange={(e) => handleStockChange(p.productId, e.target.value)}
                        className="w-20 px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 font-mono font-bold"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1 font-mono">
                        <span className="text-slate-400">{currencySymbol}</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={p.sellingPrice}
                          onChange={(e) => handlePriceChange(p.productId, e.target.value)}
                          className="w-24 px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 font-bold"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleSaveProduct(p)}
                        disabled={savingId === p.productId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-xs cursor-pointer disabled:bg-indigo-300"
                      >
                        {savingId === p.productId ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        <span>Update</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
