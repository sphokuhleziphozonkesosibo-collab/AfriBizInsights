import React from 'react';
import { LayoutDashboard, UploadCloud, Store } from 'lucide-react';

interface NavbarProps {
  onOpenUpload: () => void;
  businessName?: string;
  currency?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenUpload,
  businessName = 'Mzansi Trendz Store',
  currency = 'ZAR',
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-sm">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">AfriBiz</span>
              <span className="text-xl font-light text-indigo-400">Insights</span>
            </div>
          </div>

          {/* Store Info & Action Buttons */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full text-xs text-slate-300">
              <Store className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-medium text-slate-200">{businessName}</span>
              <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono text-[10px]">
                {currency}
              </span>
            </div>

            <button
              onClick={onOpenUpload}
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Import Sales Data</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};