import React, { useState } from 'react';
import { Calendar, Filter, RotateCcw } from 'lucide-react';

interface DateRangeFilterProps {
  onApplyFilter: (startDate: string | null, endDate: string | null, label: string) => void;
  activeLabel: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onApplyFilter,
  activeLabel,
}) => {
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const setPreset = (days: number | null, label: string) => {
    setShowCustom(false);
    if (days === null) {
      // All Time
      onApplyFilter(null, null, 'All Time');
      return;
    }

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    onApplyFilter(startStr, endStr, label);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    onApplyFilter(customStart, customEnd, `${customStart} to ${customEnd}`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider mr-1">
            <Calendar className="h-4 w-4 text-indigo-600" />
            Time Filter:
          </span>

          <button
            onClick={() => setPreset(null, 'All Time')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeLabel === 'All Time'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Time
          </button>

          <button
            onClick={() => setPreset(7, 'Last 7 Days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeLabel === 'Last 7 Days'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            7 Days
          </button>

          <button
            onClick={() => setPreset(30, 'Last 30 Days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeLabel === 'Last 30 Days'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            30 Days
          </button>

          <button
            onClick={() => setPreset(90, 'Last 90 Days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeLabel === 'Last 90 Days'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            90 Days
          </button>

          <button
            onClick={() => setShowCustom(!showCustom)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              showCustom || activeLabel.includes('to')
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Custom Range</span>
          </button>
        </div>

        {/* Current Active Label Display */}
        <div className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl self-start md:self-auto">
          Viewing: {activeLabel}
        </div>
      </div>

      {/* Custom Date Form (Shown when Custom Range is clicked) */}
      {showCustom && (
        <form onSubmit={handleCustomSubmit} className="mt-3.5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <label className="font-bold text-slate-600">From:</label>
            <input
              type="date"
              required
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="font-bold text-slate-600">To:</label>
            <input
              type="date"
              required
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 font-mono text-xs"
            />
          </div>

          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-colors shadow-2xs"
          >
            Apply Range
          </button>

          <button
            type="button"
            onClick={() => setPreset(null, 'All Time')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            title="Reset to All Time"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
};

export default DateRangeFilter;