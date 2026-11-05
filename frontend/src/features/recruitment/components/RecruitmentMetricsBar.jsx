import React from 'react';

/**
 * Portfolio summary metrics strip for recruitment evaluation stages.
 */
const RecruitmentMetricsBar = ({ totalCount = 0, stageCounts = {} }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Total Applicants
        </p>
        <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">{totalCount}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">All candidate records</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Initial Review
        </p>
        <p className="text-xl font-bold text-[#0038A8] font-mono tabular-nums mt-1">
          {stageCounts.initial_evaluation || 0}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">Document screening</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Comparative Assessment
        </p>
        <p className="text-xl font-bold text-amber-700 font-mono tabular-nums mt-1">
          {stageCounts.comparative_assessment || 0}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">Rubric points evaluation</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Ready for Hiring
        </p>
        <p className="text-xl font-bold text-blue-700 font-mono tabular-nums mt-1">
          {stageCounts.appointment_proposed || 0}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">Endorsed to SDS</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Hired / Appointed
        </p>
        <p className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
          {stageCounts.hired || 0}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">Appointments recorded</p>
      </div>
    </div>
  );
};

export default RecruitmentMetricsBar;
