import React from 'react';
import { DollarSign, Wallet, Percent, Receipt, ShoppingCart, Award } from 'lucide-react';
import type { DashboardSummary } from '../services/api';

interface KpiCardsProps {
  summary: DashboardSummary | null;
  currency?: string;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ summary, currency = 'ZAR' }) => {
  const currencySymbol = currency === 'ZAR' ? 'R' : currency;

  return (
    <div className="space-y-4">
      {/* 1. Primary Financial Health Tier */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Sales Revenue</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {currencySymbol} {summary ? summary.totalRevenue.toLocaleString() : '0'}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {summary?.totalOrders ?? 0} total transactions
          </p>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Operating Expenses</p>
              <h3 className="text-2xl font-black text-rose-600 mt-1">
                - {currencySymbol} {summary ? summary.totalExpenses.toLocaleString() : '0'}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Rent, utilities & staff costs</p>
        </div>

        {/* True Net Profit */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-md border border-indigo-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">True Net Profit</p>
              <h3 className="text-2xl font-black text-white mt-1">
                {currencySymbol} {summary ? summary.netProfit.toLocaleString() : '0'}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-700/60 text-indigo-200 border border-indigo-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs">
            <span className="bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-bold">
              {summary?.netMarginPercentage ?? 0}% Net Margin
            </span>
          </div>
        </div>

        {/* Gross Profit Margin */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Margin</p>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">
                {summary?.grossMarginPercentage ?? 0}%
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Gross Profit: {currencySymbol} {summary ? summary.grossProfit.toLocaleString() : '0'}
          </p>
        </div>
      </div>

      {/* 2. Secondary Operational Tier */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs text-slate-500">Average Spend / Order:</span>
              <span className="font-bold text-slate-900 ml-2">
                {currencySymbol} {summary ? summary.averageOrderValue.toLocaleString() : '0'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs text-slate-500">Top Selling Item:</span>
              <span className="font-bold text-slate-900 ml-2">
                {summary?.bestSellingProduct || 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};