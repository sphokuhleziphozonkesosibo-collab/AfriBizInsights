import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Boxes,
  Cpu,
  Users,
  Truck,
  FileSpreadsheet,
  Download,
  MessageSquare,
  Sparkles,
  X,
} from 'lucide-react';
import type { AuthUser } from '../services/api';

export type DashboardView =
  | 'overview'
  | 'financials'
  | 'inventory'
  | 'forecasts'
  | 'customers'
  | 'suppliers';

interface SidebarProps {
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  user: AuthUser | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenWhatsApp: () => void;
  onDownloadBackup: () => void;
  onExportReport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  user,
  isOpenMobile,
  onCloseMobile,
  onOpenWhatsApp,
  onDownloadBackup,
  onExportReport,
}) => {
  const isOwner = user?.role === 'Owner' || user?.role === 'Manager' || !user;

  const navigationItems: { id: DashboardView; label: string; icon: React.FC<{ className?: string }>; ownerOnly?: boolean }[] = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'financials', label: 'Financials & Profit', icon: Wallet, ownerOnly: true },
    { id: 'inventory', label: 'Inventory & Stock', icon: Boxes },
    { id: 'forecasts', label: 'AI Demand Forecasts', icon: Cpu },
    { id: 'customers', label: 'Customer Loyalty & CRM', icon: Users },
    { id: 'suppliers', label: 'Suppliers & Vendors', icon: Truck, ownerOnly: true },
  ];

  const handleSelect = (view: DashboardView) => {
    onViewChange(view);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full select-none bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 p-2 rounded-xl text-white shadow-md shadow-indigo-600/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white">AfriBiz</span>
            <span className="text-lg font-light text-indigo-400">Insights</span>
          </div>
        </div>

        <button onClick={onCloseMobile} className="md:hidden text-slate-400 hover:text-white p-1">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Intelligence Workspace
        </p>

        {navigationItems
          .filter((item) => !item.ownerOnly || isOwner)
          .map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold translate-x-1'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

        {/* Executive Actions */}
        {isOwner && (
          <div className="pt-6 mt-6 border-t border-slate-800 space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Executive Actions
            </p>

            <button
              onClick={() => {
                onOpenWhatsApp();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-emerald-400 hover:bg-slate-800/70 transition-colors cursor-pointer"
            >
              <MessageSquare className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>WhatsApp Daily Recap</span>
            </button>

            <button
              onClick={() => {
                onExportReport();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-indigo-400 hover:bg-slate-800/70 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>Print Executive PDF</span>
            </button>

            <button
              onClick={() => {
                onDownloadBackup();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-blue-400 hover:bg-slate-800/70 transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Export Store Backup</span>
            </button>
          </div>
        )}
      </div>

      {/* Cloud Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono text-[10px]">Cloud Telemetry Active</span>
        </div>
        <span className="font-bold text-slate-500 text-[10px]">v1.0-Prod</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 flex-col shrink-0 border-r border-slate-800 min-h-screen sticky top-0 h-screen">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};