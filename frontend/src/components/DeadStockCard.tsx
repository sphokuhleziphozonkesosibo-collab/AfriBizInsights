import React from 'react';
import type { DeadStockProduct } from '../services/api';
import { Archive, AlertOctagon, Lightbulb } from 'lucide-react';

interface DeadStockCardProps {
  products: DeadStockProduct[];
  currency?: string;
}

export const DeadStockCard: React.FC<DeadStockCardProps> = ({
  products,
  currency = 'ZAR',
}) => {
  const currencySymbol = currency === 'ZAR' ? 'R' : currency;
  const totalTrapped = products.reduce((acc, p) => acc + p.trappedCapital, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Archive className="h-5 w-5 text-amber-600" />
            Dead Stock & Trapped Capital Radar
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Inventory with zero sales in 30+ days holding up cash flow
          </p>
        </div>

        {totalTrapped > 0 && (
          <div className="bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-900 self-start sm:self-auto flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-amber-600" />
            <span>Trapped Cash: {currencySymbol} {totalTrapped.toLocaleString()}</span>
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
          ✨ Excellent inventory health! No dead stock detected in the last 30 days.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p, idx) => (
            <div
              key={p.productId || idx}
              className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                  <span className="text-[11px] text-slate-500">{p.category}</span>
                </div>
                <span className="text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                  {p.daysSinceLastSale}+ days inactive
                </span>
              </div>

              <div className="flex justify-between items-center text-xs pt-2 border-t border-amber-200/60 font-mono">
                <span className="text-slate-600">Unsold: <strong>{p.currentStock} units</strong></span>
                <span className="text-rose-700 font-bold">
                  Trapped: {currencySymbol} {p.trappedCapital.toLocaleString()}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-amber-200/70 text-[11px] text-slate-700 flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-snug">{p.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};