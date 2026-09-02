import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Store,
  LogOut,
  PlusCircle,
  FileSpreadsheet,
  Boxes,
  Truck,
  MessageSquare,
  Download,
  User as UserIcon,
} from 'lucide-react';
import type { AuthUser } from '../services/api';

interface NavbarProps {
  user: AuthUser | null;
  onOpenUpload: () => void;
  onOpenExpense: () => void;
  onOpenInventory: () => void;
  onOpenSuppliers: () => void;
  onOpenWhatsApp: () => void;
  onDownloadBackup: () => void;
  onExportReport: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenUpload,
  onOpenExpense,
  onOpenInventory,
  onOpenSuppliers,
  onOpenWhatsApp,
  onDownloadBackup,
  onExportReport,
  onLogout,
}) => {
  const isOwner = user?.role === 'Owner' || !user;

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-sm">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">AfriBiz</span>
              <span className="text-xl font-light text-indigo-400">Insights</span>
            </div>
          </div>

          {/* Store Info & Action Buttons */}
          <div className="flex items-center space-x-2">
            {user && (
              <>
                <div className="hidden md:flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full text-xs text-slate-300">
                  <Store className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="font-medium text-slate-200">{user.businessName}</span>
                  <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">
                    {user.currency}
                  </span>
                </div>

                <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-400 px-2">
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>{user.fullName} ({user.role})</span>
                </div>
              </>
            )}

            {/* Suppliers Directory */}
            {isOwner && (
              <button
                onClick={onOpenSuppliers}
                title="Suppliers & Vendor Directory"
                className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Truck className="h-4 w-4 text-indigo-400" />
                <span className="hidden sm:inline">Suppliers</span>
              </button>
            )}

            {/* Stock Manager */}
            <button
              onClick={onOpenInventory}
              title="Manage Shelf Stock & Prices"
              className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Boxes className="h-4 w-4 text-indigo-400" />
              <span className="hidden sm:inline">Stock</span>
            </button>

            {/* WhatsApp Summary */}
            {isOwner && (
              <button
                onClick={onOpenWhatsApp}
                title="Generate WhatsApp Daily Summary"
                className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            )}

            {/* Download Backup */}
            {isOwner && (
              <button
                onClick={onDownloadBackup}
                title="Download Full Store Backup (.csv)"
                className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4 text-blue-400" />
                <span className="hidden sm:inline">Backup</span>
              </button>
            )}

            {/* Executive Report */}
            {isOwner && (
              <button
                onClick={onExportReport}
                className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                <span className="hidden sm:inline">Report</span>
              </button>
            )}

            {/* Record Expense */}
            {isOwner && (
              <button
                onClick={onOpenExpense}
                className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="h-4 w-4 text-rose-400" />
                <span className="hidden sm:inline">Expense</span>
              </button>
            )}

            {/* Import Sales */}
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Import</span>
            </button>

            {user && (
              <button
                onClick={onLogout}
                title="Logout"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};