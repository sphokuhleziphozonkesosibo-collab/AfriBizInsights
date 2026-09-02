import React from 'react';
import { DollarSign, Wallet, Percent, Receipt, ShoppingCart, Award, Users, CreditCard } from 'lucide-react';
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
        {/* Gross Revenue */}
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
            COGS: {currencySymbol} {summary ? summary.costOfGoodsSold.toLocaleString() : '0'}
          </p>
        </div>
      </div>

      {/* 2. Customer Retention & Payment Channels Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block font-semibold uppercase">Avg Order Value:</span>
              <span className="font-black text-slate-900 text-sm">
                {currencySymbol} {summary ? summary.averageOrderValue.toLocaleString() : '0'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block font-semibold uppercase">Customer Loyalty:</span>
              <span className="font-black text-purple-700 text-sm">
                {summary?.repeatCustomerPercentage ?? 0}% Repeat Buyers ({summary?.uniqueCustomerCount ?? 0} identified)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3 truncate">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <Award className="h-4 w-4" />
            </div>
            <div className="truncate">
              <span className="text-[11px] text-slate-500 block font-semibold uppercase">Top Selling Item:</span>
              <span className="font-black text-slate-900 text-sm truncate block" title={summary?.bestSellingProduct}>
                {summary?.bestSellingProduct || 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Payment Channels Telemetry (Cash vs Card vs Mobile Money vs EFT) */}
      {summary?.paymentChannels && summary.paymentChannels.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-indigo-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Payment Channels & Cash Flow Split
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {summary.paymentChannels.map((channel, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">{channel.paymentMethod}</span>
                  <span className="font-mono text-indigo-600 font-bold">{channel.percentageOfTotal}%</span>
                </div>
                <p className="text-sm font-black text-slate-900 mt-1">
                  {currencySymbol} {channel.totalRevenue.toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-500">{channel.transactionCount} transactions</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};