import React from 'react';
import type { DemandForecast } from '../services/api';
import { Cpu, AlertTriangle, CheckCircle2, TrendingUp, Package, Truck } from 'lucide-react';

interface ForecastCardsProps {
  forecasts: DemandForecast[];
  onOrderProduct?: (productId: string, productName: string, suggestedQty: number) => void;
}

export const ForecastCards: React.FC<ForecastCardsProps> = ({ forecasts, onOrderProduct }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-600" />
            AI Machine Learning Demand Forecast
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            30-Day predictive unit velocity & automated stockout countdowns
          </p>
        </div>
        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full self-start sm:self-auto">
          Ridge Time-Series Model Active
        </span>
      </div>

      {forecasts.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs">
          No inventory models calculated yet. Upload sales data to trigger forecasts.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forecasts.map((f, idx) => (
            <div
              key={f.productId || idx}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                f.stockoutWarning
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="text-sm font-bold text-slate-900 truncate" title={f.productName}>
                      {f.productName}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" /> Current Stock: <strong>{f.currentStock} units</strong>
                    </p>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0">
                    {Math.round(f.confidenceScore * 100)}% Confidence
                  </span>
                </div>

                {/* Metric Breakdown */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200/60 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px]">Predicted Demand</span>
                    <p className="font-bold text-indigo-600 text-base flex items-center gap-1 mt-0.5">
                      <TrendingUp className="h-4 w-4" />
                      ~{f.predictedUnitsNextMonth} units
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Daily Velocity</span>
                    <p className="font-bold text-slate-800 text-sm mt-1">
                      {f.dailyRunRate} / day
                    </p>
                  </div>
                </div>
              </div>

              {/* Stockout Risk & Action Button */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs gap-2">
                {f.stockoutWarning ? (
                  <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-[11px]">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Runout in ~{f.stockoutInDays ?? 0}d</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Stock Healthy (30+d)</span>
                  </div>
                )}

                {f.recommendedReorderQty > 0 && onOrderProduct && (
                  <button
                    onClick={() => onOrderProduct(f.productId, f.productName, f.recommendedReorderQty)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    <Truck className="h-3 w-3" />
                    <span>Order +{f.recommendedReorderQty}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ForecastCards;