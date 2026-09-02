import React from 'react';
import type { TopCustomer } from '../services/api';
import { Users, Phone } from 'lucide-react';

interface TopCustomersTableProps {
  customers: TopCustomer[];
  currency?: string;
}

export const TopCustomersTable: React.FC<TopCustomersTableProps> = ({
  customers,
  currency = 'ZAR',
}) => {
  const currencySymbol = currency === 'ZAR' ? 'R' : currency;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Top VIP Repeat Customers Leaderboard
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked by total lifetime store spend & visit frequency
          </p>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs">
          No customer identifiers recorded yet. Include phone numbers or customer names in your sales CSV.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="pb-3 pl-2">Customer Identifier</th>
                <th className="pb-3 text-center">Visits / Orders</th>
                <th className="pb-3 text-right">Avg Basket Size</th>
                <th className="pb-3 pr-2 text-right">Total Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {customers.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 pl-2 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{c.customerIdentifier}</span>
                    </div>
                  </td>
                  <td className="py-3 text-center font-semibold text-slate-700">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[11px] font-bold text-slate-700">
                      {c.totalOrders} visits
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono text-slate-600">
                    {currencySymbol} {c.averageBasketSize.toLocaleString()}
                  </td>
                  <td className="py-3 pr-2 text-right font-bold font-mono text-purple-700">
                    {currencySymbol} {c.totalSpend.toLocaleString()}
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

export default TopCustomersTable;