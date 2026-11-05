import React from 'react';
import { Clock as ClockIcon, UserCheck, FileCheck, ShieldAlert } from 'lucide-react';

/**
 * Metric summary strip for division leave processing docket.
 */
const LeaveDocketMetricsBar = ({
  totalPendingCount = 0,
  pendingActionRequiredCount = 0,
  approvedCount = 0,
  rejectedCount = 0,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-white border border-slate-200 p-3.5 rounded shadow-xs">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Pending Review
        </p>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalPendingCount}
          </span>
          <ClockIcon className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-3.5 rounded shadow-xs">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Awaiting Your Action
        </p>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold font-mono tabular-nums text-amber-700">
            {pendingActionRequiredCount}
          </span>
          <UserCheck className="w-4 h-4 text-amber-600" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-3.5 rounded shadow-xs">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Approved Records
        </p>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {approvedCount}
          </span>
          <FileCheck className="w-4 h-4 text-emerald-600" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-3.5 rounded shadow-xs">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Disapproved
        </p>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-600">
            {rejectedCount}
          </span>
          <ShieldAlert className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </div>
  );
};

export default LeaveDocketMetricsBar;
