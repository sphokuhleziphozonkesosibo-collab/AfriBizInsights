import React, { useState, useEffect } from 'react';
import { X, FileCheck, Printer, AlertCircle } from 'lucide-react';
import { getSuppliers, generatePurchaseOrder, type Supplier, type PurchaseOrder } from '../services/api';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  productName: string;
  suggestedQty: number;
  currency?: string;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  suggestedQty,
  currency = 'ZAR',
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [orderQty, setOrderQty] = useState(suggestedQty > 0 ? suggestedQty : 20);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [poResult, setPoResult] = useState<PurchaseOrder | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currencySymbol = currency === 'ZAR' ? 'R' : currency;

  useEffect(() => {
    if (isOpen) {
      setPoResult(null);
      setErrorMsg(null);
      setOrderQty(suggestedQty > 0 ? suggestedQty : 20);
      loadSuppliers();
    }
  }, [isOpen, suggestedQty]);

  const loadSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
      if (data.length > 0) {
        setSelectedSupplierId(data[0].supplierId);
      }
    } catch {
      setErrorMsg('Failed to fetch suppliers.');
    }
  };

  const handleGeneratePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !selectedSupplierId) {
      setErrorMsg('Please select a valid supplier.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const po = await generatePurchaseOrder(productId, selectedSupplierId, orderQty, notes);
      setPoResult(po);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to generate Purchase Order.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Generate Supplier Purchase Order</h3>
            <p className="text-xs text-slate-500">Formal restocking order for {productName}</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {poResult ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 font-mono space-y-2 text-slate-800">
              <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                <div>
                  <h4 className="font-bold text-indigo-600 text-sm">{poResult.poNumber}</h4>
                  <span className="text-[11px] text-slate-500">{poResult.businessName}</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  OFFICIAL PO
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Vendor:</span>
                  <strong>{poResult.supplierName}</strong>
                  <p className="text-slate-500">{poResult.supplierPhone}</p>
                </div>
                <div>
                  <span className="text-slate-500 block">Est. Delivery:</span>
                  <strong>~{poResult.expectedDeliveryDays} Days</strong>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 text-[11px]">
                <div className="flex justify-between">
                  <span>Item: <strong>{poResult.productName}</strong></span>
                  <span>Qty: <strong>{poResult.quantity} units</strong></span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Unit Cost: {currencySymbol} {poResult.estimatedUnitCost}</span>
                  <span className="font-bold text-indigo-700">Total: {currencySymbol} {poResult.estimatedTotalCost.toLocaleString()}</span>
                </div>
              </div>

              {poResult.notes && (
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                  Notes: {poResult.notes}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                <Printer className="h-4 w-4" />
                <span>Print Purchase Order</span>
              </button>
            </div>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            <p>No suppliers registered in your directory yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Please add a supplier using the "Suppliers" button in the top navbar first.</p>
          </div>
        ) : (
          <form onSubmit={handleGeneratePo} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Supplier</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 font-semibold"
              >
                {suppliers.map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.name} ({s.leadTimeDays} days lead time)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Order Quantity (Units)</label>
              <input
                type="number"
                min="1"
                required
                value={orderQty}
                onChange={(e) => setOrderQty(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Special Order Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Urgent reorder, please deliver before Friday"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-xs disabled:bg-indigo-300"
              >
                {loading ? 'Generating...' : 'Generate Official PO'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderModal;