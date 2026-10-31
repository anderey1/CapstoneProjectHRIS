import React from 'react';
import { CalendarCheck, ShieldCheck, Clock, Layers } from 'lucide-react';

/**
 * LeaveBalanceCards
 * Compact institutional credit balance strip with tabular numerals.
 * Conforms to CSC Form No. 6 (Sec 7.B Certification of Leave Credits).
 */
const LeaveBalanceCards = ({ employee }) => {
  const vlBalance = employee?.vacation_leave_balance ?? 0;
  const slBalance = employee?.sick_leave_balance ?? 0;
  const totalBalance = Number(vlBalance) + Number(slBalance);

  return (
    <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            CSC Form No. 6 (Sec 7.B)
          </span>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Certified Leave Credit Balance Ledger
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Active Division Plantilla Record</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Vacation Leave Credits */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Vacation Leave (VL)</span>
            <CalendarCheck className="w-4 h-4 text-[#0038a8]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {vlBalance}
            </span>
            <span className="text-[11px] font-medium text-slate-500">working days</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Available for planned leaves & special privilege</p>
        </div>

        {/* Sick Leave Credits */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Sick Leave (SL)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {slBalance}
            </span>
            <span className="text-[11px] font-medium text-slate-500">working days</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Certified for medical and illness absences</p>
        </div>

        {/* Combined Total */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cumulative Total</span>
            <Layers className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {totalBalance.toFixed(3).replace(/\.?0+$/, '')}
            </span>
            <span className="text-[11px] font-medium text-slate-500">total credits</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Subject to terminal leave / monetization audits</p>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalanceCards;
