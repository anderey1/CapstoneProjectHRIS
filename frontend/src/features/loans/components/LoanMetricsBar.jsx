import React from 'react';

const formatCurrency = (val) => {
  const num = parseFloat(val) || 0;
  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Summary KPI cards for Provident Fund Loan Management.
 */
const LoanMetricsBar = ({
  pendingCount = 0,
  verifiedCount = 0,
  approvedCount = 0,
  totalReleasedValue = 0,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Awaiting Verification
        </span>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {pendingCount}
          </span>
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Accountant Audit
          </span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Superintendent Endorsement
        </span>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {verifiedCount}
          </span>
          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Executive Review
          </span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Ready for Disbursement
        </span>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {approvedCount}
          </span>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Cashier / ATM
          </span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Active Loans Released
        </span>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-xl font-bold text-[#0038A8] font-mono tabular-nums">
            {formatCurrency(totalReleasedValue)}
          </span>
          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            Servicing
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoanMetricsBar;
