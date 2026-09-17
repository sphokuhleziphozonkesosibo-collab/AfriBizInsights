import React from 'react';
import {
  UploadCloud,
  Store,
  LogOut,
  PlusCircle,
  Users as UsersIcon,
  User as UserIcon,
} from 'lucide-react';
import type { AuthUser } from '../services/api';

interface NavbarProps {
  user: AuthUser | null;
  onOpenUpload: () => void;
  onOpenExpense: () => void;
  onOpenStaff: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenUpload,
  onOpenExpense,
  onOpenStaff,
  onLogout,
}) => {
  const isOwner = user?.role === 'Owner' || user?.role === 'Manager' || !user;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 h-16 flex items-center px-6 justify-between shadow-2xs">
      {/* Store Identity & Currency Badge */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900 leading-tight">{user.businessName}</h2>
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">
                  {user.currency}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Authenticated Enterprise Tenant</p>
            </div>
          </div>
        ) : (
          <span className="text-xs font-bold text-slate-400">AfriBiz Insights Portal</span>
        )}
      </div>

      {/* Quick Actions & User Profile */}
      <div className="flex items-center gap-2.5">
        {isOwner && (
          <button
            onClick={onOpenExpense}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Record Cost</span>
          </button>
        )}

        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          <span>Import Sales File</span>
        </button>

        {isOwner && (
          <button
            onClick={onOpenStaff}
            title="Manage Staff & Cashiers"
            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
          >
            <UsersIcon className="h-4 w-4" />
          </button>
        )}

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 ml-1">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 leading-none">{user.fullName}</span>
              <span className="text-[10px] text-slate-400 font-semibold">{user.role}</span>
            </div>

            <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <UserIcon className="h-4 w-4" />
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};