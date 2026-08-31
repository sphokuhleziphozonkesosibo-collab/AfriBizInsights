import React from 'react';
import type { BusinessAlert } from '../services/api';
import { AlertCircle, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

interface AlertsListProps {
  alerts: BusinessAlert[];
}

export const AlertsList: React.FC<AlertsListProps> = ({ alerts }) => {
  const getSeverityStyle = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return {
          card: 'bg-red-50/70 border-red-200',
          icon: AlertCircle,
          iconColor: 'text-red-600',
          badge: 'bg-red-100 text-red-700',
        };
      case 'high':
        return {
          card: 'bg-amber-50/70 border-amber-200',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
          badge: 'bg-amber-100 text-amber-800',
        };
      case 'medium':
        return {
          card: 'bg-indigo-50/60 border-indigo-200',
          icon: Sparkles,
          iconColor: 'text-indigo-600',
          badge: 'bg-indigo-100 text-indigo-700',
        };
      default:
        return {
          card: 'bg-emerald-50/60 border-emerald-200',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600',
          badge: 'bg-emerald-100 text-emerald-700',
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          Smart Business Insights
        </h3>
        <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
          AI Radar Active
        </span>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1 flex-1">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No active alerts. System healthy.
          </div>
        ) : (
          alerts.map((alert, index) => {
            const style = getSeverityStyle(alert.severity);
            const Icon = style.icon;
            return (
              <div
                key={alert.alertId || index}
                className={`p-3.5 rounded-lg border ${style.card} transition-all`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 ${style.iconColor} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {alert.title}
                      </h4>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};