import React from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Award } from 'lucide-react';
import type { DashboardSummary } from '../services/api';

interface KpiCardsProps {
  summary: DashboardSummary | null;
  currency?: string;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ summary, currency = 'ZAR' }) => {
  const currencySymbol = currency === 'ZAR' ? 'R' : currency;

  const kpis = [
    {
      title: 'Total Revenue',
      value: summary ? `${currencySymbol} ${summary.totalRevenue.toLocaleString()}` : 'R 0',
      icon: DollarSign,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      detail: summary?.revenueGrowthPercentage ? `+${summary.revenueGrowthPercentage}% vs last month` : 'Current revenue',
    },
    {
      title: 'Total Orders',
      value: summary ? summary.totalOrders.toLocaleString() : '0',
      icon: ShoppingCart,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      detail: 'Completed transactions',
    },
    {
      title: 'Average Order Value',
      value: summary ? `${currencySymbol} ${summary.averageOrderValue.toLocaleString()}` : 'R 0',
      icon: TrendingUp,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      detail: 'Per transaction spend',
    },
    {
      title: 'Best Selling Product',
      value: summary?.bestSellingProduct || 'None',
      icon: Award,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      detail: 'Highest volume item',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">{kpi.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-2 truncate max-w-[200px]" title={kpi.value}>
                  {kpi.value}
                </h3>
              </div>
              <div className={`p-2.5 rounded-lg border ${kpi.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">{kpi.detail}</p>
          </div>
        );
      })}
    </div>
  );
};