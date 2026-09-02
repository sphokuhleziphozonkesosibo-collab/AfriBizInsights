import React, { useState, useEffect } from 'react';
import { X, Truck, Plus, Phone, Mail, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { getSuppliers, createSupplier, type Supplier } from '../services/api';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState('3');

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
    }
  }, [isOpen]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await getSuppliers();
      setSuppliers(data);
    } catch {
      setErrorMsg('Failed to load suppliers from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      await createSupplier({
        name,
        contactPerson,
        phone,
        email,
        address,
        leadTimeDays: parseInt(leadTimeDays) || 3,
      });

      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setIsAdding(false);
      loadSuppliers();
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save supplier.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative border border-slate-100 max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Supplier & Distributor Directory</h3>
              <p className="text-xs text-slate-500">Manage vendor contacts and delivery lead times</p>
            </div>
          </div>

          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isAdding ? (
          <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900">New Supplier Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company / Supplier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Durban Clothing Wholesalers"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. David Ndlovu"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 031 555 1234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="orders@supplier.co.za"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Delivery Lead Time (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  required
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Physical Address / City</label>
                <input
                  type="text"
                  placeholder="e.g. 45 Umgeni Road, Durban"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                {loading ? 'Saving...' : 'Save Supplier'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2.5">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading suppliers...</span>
              </div>
            ) : suppliers.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No suppliers registered yet. Click "Add Supplier" above.
              </div>
            ) : (
              suppliers.map((s) => (
                <div
                  key={s.supplierId}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">Contact: {s.contactPerson || 'N/A'}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-600 font-mono">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" /> {s.phone}
                      </span>
                      {s.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" /> {s.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg self-start sm:self-auto font-medium text-slate-700">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{s.leadTimeDays} days lead time</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierModal;