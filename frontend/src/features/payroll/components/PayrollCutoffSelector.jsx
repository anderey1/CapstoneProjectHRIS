import React from 'react';
import { CUTOFF_PERIODS, getCutoffStatus } from './payrollConstants';

const PayrollCutoffSelector = ({ selectedCutoff, onSelectCutoff, allPayrolls }) => {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-black uppercase tracking-widest opacity-40 ml-1">Select Pay Period to Process</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-base-100 p-2 rounded-2xl border border-base-200">
        {CUTOFF_PERIODS.map(period => {
          const periodPayrolls = allPayrolls?.filter(p => p.cutoff_period === period) || [];
          const status = getCutoffStatus(periodPayrolls);
          const isSelected = selectedCutoff === period;
          
          return (
            <button
              key={period}
              type="button"
              onClick={() => onSelectCutoff(period)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all border ${
                isSelected 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]' 
                  : 'bg-white border-base-200 hover:border-blue-300 text-base-content'
              }`}
            >
              <span className="text-[11px] font-black uppercase tracking-wider">{period}</span>
              <span className={`mt-2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                status === 'released' 
                  ? isSelected ? 'bg-white/25 border-white/20 text-white' : 'bg-success/10 border-success/20 text-success'
                  : status === 'approved'
                  ? isSelected ? 'bg-white/25 border-white/20 text-white' : 'bg-blue-100 border-blue-200 text-blue-700'
                  : status === 'draft'
                  ? isSelected ? 'bg-amber-400/30 border-amber-400/40 text-amber-200' : 'bg-amber-100 border-amber-200 text-amber-700'
                  : isSelected ? 'bg-white/10 border-white/10 text-white/60' : 'bg-base-100 border-base-200 text-base-content/40'
              }`}>
                {status === 'unprepared' ? 'Not Prepared' : status}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PayrollCutoffSelector;
