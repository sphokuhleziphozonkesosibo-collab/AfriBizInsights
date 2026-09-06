import React, { useState, useEffect } from 'react';
import { X, UserCheck, UserPlus, Trash2, Mail, Lock, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { getStaffUsers, createStaffUser, deleteStaffUser, type StaffUser } from '../services/api';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffModal: React.FC<StaffModalProps> = ({ isOpen, onClose }) => {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Cashier' | 'Manager' | 'Staff'>('Cashier');

  useEffect(() => {
    if (isOpen) {
      loadStaff();
    }
  }, [isOpen]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await getStaffUsers();
      setStaffList(data);
    } catch {
      setErrorMsg('Failed to load staff list.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      await createStaffUser({
        fullName,
        email,
        password,
        role,
      });

      setFullName('');
      setEmail('');
      setPassword('');
      setRole('Cashier');
      setIsAdding(false);
      loadStaff();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create staff account.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this employee account?')) return;
    try {
      setDeletingId(userId);
      await deleteStaffUser(userId);
      loadStaff();
    } catch {
      setErrorMsg('Failed to delete staff account.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 relative border border-slate-100 max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Staff & Cashier Accounts</h3>
              <p className="text-xs text-slate-500">Manage employee access and role-based permissions</p>
            </div>
          </div>

          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add Staff</span>
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
          <form onSubmit={handleCreateStaff} className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-indigo-600" />
              <span>New Employee Account</span>
            </h4>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Nandi Cele"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address (Login)</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="nandi@store.co.za"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Role / Permissions</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white font-bold text-indigo-700"
                >
                  <option value="Cashier">Cashier (Margins & Expenses Hidden)</option>
                  <option value="Manager">Manager (Full Store Access)</option>
                  <option value="Staff">Staff (Inventory & Ingestion Only)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Temporary Password</label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
              >
                {loading ? 'Creating...' : 'Create Employee Account'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="py-10 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading staff accounts...</span>
              </div>
            ) : staffList.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No extra staff accounts. Only the primary Store Owner is registered.
              </div>
            ) : (
              staffList.map((user) => (
                <div
                  key={user.userId}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900">{user.fullName}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          user.role === 'Owner'
                            ? 'bg-purple-100 text-purple-700'
                            : user.role === 'Manager'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5 font-mono">{user.email}</p>
                  </div>

                  {user.role !== 'Owner' && (
                    <button
                      onClick={() => handleDeleteStaff(user.userId)}
                      disabled={deletingId === user.userId}
                      title="Remove Staff Account"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
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

export default StaffModal;