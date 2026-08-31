import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { SalesTrend } from '../services/api';
import { TrendingUp } from 'lucide-react';

interface SalesChartProps {
  data: SalesTrend[];
  currency?: string;
}

export const SalesChart: React.FC<SalesChartProps> = ({ data, currency = 'ZAR' }) => {
  const currencySymbol = currency === 'ZAR' ? 'R' : currency;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Revenue Trend
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Historical revenue trajectory over time</p>
        </div>
        <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-md">
          Last 30 Days
        </span>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <p className="text-sm">No transaction history recorded yet.</p>
          <p className="text-xs mt-1 text-slate-400">Upload a sales CSV to see trends.</p>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(val) => `${currencySymbol}${val}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-800">
                        <p className="text-slate-400 font-medium mb-1">{label}</p>
                        <p className="font-bold text-indigo-300">
                          Revenue: {currencySymbol} {Number(payload[0].value).toLocaleString()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="totalRevenue"
                stroke="#4f46e5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};