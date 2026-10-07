import React from 'react';
import { CUTOFF_PERIODS, getCutoffStatus } from './payrollConstants';

const statusLabels = {
  unprepared: 'Not Prepared',
  draft: 'Draft Ready',
  approved: 'Superintendent Signed',
  released: 'Disbursed to Bank',
};

const statusStyles = {
  unprepared: 'bg-slate-100 text-slate-600 border-slate-200',
  draft: 'bg-amber-50 text-amber-800 border-amber-200',
  approved: 'bg-blue-50 text-[#0038A8] border-blue-200',
  released: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

const PayrollCutoffSelector = ({ selectedCutoff, onSelectCutoff, allPayrolls }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          Payroll Cutoff Schedule
        </span>
        <span className="text-[11px] text-slate-500 font-medium">
          Select semi-monthly pay cycle to review and process
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {CUTOFF_PERIODS.map(period => {
          const periodPayrolls = allPayrolls?.filter(p => p.cutoff_period === period) || [];
          const status = getCutoffStatus(periodPayrolls);
          const isSelected = selectedCutoff === period;

          return (
            <button
              key={period}
              type="button"
              onClick={() => onSelectCutoff(period)}
              className={`flex flex-col items-start p-3 rounded-md border text-left transition-all ${
                isSelected
                  ? 'bg-blue-50/70 border-[#0038A8] ring-1 ring-[#0038A8]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-semibold ${isSelected ? 'text-[#0038A8]' : 'text-slate-800'}`}>
                  {period}
                </span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0038A8]"></span>
                )}
              </div>
              <span className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${statusStyles[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {statusLabels[status] || status}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PayrollCutoffSelector;
