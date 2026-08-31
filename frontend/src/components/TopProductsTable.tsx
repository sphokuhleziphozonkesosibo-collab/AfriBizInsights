import React from 'react';
import type { TopProduct } from '../services/api';
import { Package, ArrowUpRight } from 'lucide-react';

interface TopProductsTableProps {
  products: TopProduct[];
  currency?: string;
}

export const TopProductsTable: React.FC<TopProductsTableProps> = ({
  products,
  currency = 'ZAR',
}) => {
  const currencySymbol = currency === 'ZAR' ? 'R' : currency;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-600" />
            Top Revenue Drivers
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Ranked by total revenue generated</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-xs">
          No product sales recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-2">Product Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3 text-right">Units Sold</th>
                <th className="pb-3 pr-2 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p, idx) => (
                <tr key={p.productId || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 pl-2 font-medium text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {p.name}
                  </td>
                  <td className="py-3.5 text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-600">
                      {p.category || 'General'}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-semibold text-slate-700">
                    {p.totalUnitsSold.toLocaleString()}
                  </td>
                  <td className="py-3.5 pr-2 text-right font-bold text-indigo-600">
                    {currencySymbol} {p.totalRevenueGenerated.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};