import React from 'react';
import {
  UploadCloud,
  Store,
  LogOut,
  PlusCircle,
  Users as UsersIcon,
  User as UserIcon,
  Menu,
} from 'lucide-react';
import type { AuthUser } from '../services/api';

interface NavbarProps {
  user: AuthUser | null;
  onOpenUpload: () => void;
  onOpenExpense: () => void;
  onOpenStaff: () => void;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenUpload,
  onOpenExpense,
  onOpenStaff,
  onOpenMobileMenu,
  onLogout,
}) => {
  const isOwner = user?.role === 'Owner' || user?.role === 'Manager' || !user;

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 h-16 flex items-center px-4 sm:px-6 justify-between shadow-2xs backdrop-blur-md bg-white/95">
      {/* Left: Mobile Hamburger & Store Identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {user ? (
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-2xs hidden xs:flex">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900 leading-tight truncate max-w-[140px] sm:max-w-[220px]">
                  {user.businessName}
                </h2>
                <span className="bg-indigo-100/80 text-indigo-700 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">
                  {user.currency}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Authenticated Enterprise Tenant</p>
            </div>
          </div>
        ) : (
          <span className="text-xs font-bold text-slate-400">AfriBiz Insights Portal</span>
        )}
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {isOwner && (
          <button
            onClick={onOpenExpense}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Record Cost</span>
          </button>
        )}

        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          <span>Import Sales</span>
        </button>

        {isOwner && (
          <button
            onClick={onOpenStaff}
            title="Manage Staff & Cashiers"
            className="hidden sm:flex p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
          >
            <UsersIcon className="h-4 w-4" />
          </button>
        )}

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 ml-0.5 sm:ml-1">
            <div className="hidden lg:flex flex-col text-right">
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