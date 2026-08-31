import React, { useState } from 'react';
import { X, Receipt, AlertCircle, Loader2 } from 'lucide-react';
import { addExpense } from '../services/api';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currency?: string;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currency = 'ZAR',
}) => {
  const [category, setCategory] = useState('Utilities / Generator Fuel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid expense amount.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await addExpense({
        category,
        description,
        amount: numAmount,
      });
      onSuccess();
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to record expense.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setAmount('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-slate-100 animate-in fade-in zoom-in duration-150">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Record Business Expense</h3>
            <p className="text-xs text-slate-500">Log operational costs to compute true Net Profit</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Expense Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 font-semibold"
            >
              <option value="Utilities / Generator Fuel">Utilities / Generator Diesel / Electricity</option>
              <option value="Store Rent">Store / Warehouse Rent</option>
              <option value="Staff Wages">Staff Wages / Labour</option>
              <option value="Transport / Courier">Transport / Courier / Fuel</option>
              <option value="Packaging">Packaging & Bags</option>
              <option value="Equipment & Maintenance">Equipment & Maintenance</option>
              <option value="Marketing">Marketing / Social Ads</option>
              <option value="Other">Other Operating Cost</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Eskom recharge / Generator diesel top-up"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Amount ({currency === 'ZAR' ? 'R' : currency})
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 font-mono font-bold text-sm"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-300 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Expense</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};