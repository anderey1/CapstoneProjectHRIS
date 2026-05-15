import React from 'react';

/**
 * Attendance Stats Cards
 * 
 * Simple, professional redesign with plain language.
 */
const AttendanceStats = ({ stats }) => {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="bg-white border border-base-200 p-6 rounded-xl shadow-sm flex-1 min-w-[140px] group hover:border-primary/20 transition-all">
        <p className="text-[10px] font-black text-base-content/30 uppercase tracking-[0.2em] mb-2">Total Logs</p>
        <h3 className="text-3xl font-black text-base-content tracking-tighter">{stats.total}</h3>
      </div>
      <div className="bg-white border border-base-200 p-6 rounded-xl shadow-sm flex-1 min-w-[140px] group hover:border-error/20 transition-all">
        <p className="text-[10px] font-black text-error/40 uppercase tracking-[0.2em] mb-2">Flagged</p>
        <h3 className="text-3xl font-black text-error tracking-tighter">{stats.flagged}</h3>
      </div>
      <div className="bg-white border border-base-200 p-6 rounded-xl shadow-sm flex-1 min-w-[140px] group hover:border-success/20 transition-all">
        <p className="text-[10px] font-black text-success/40 uppercase tracking-[0.2em] mb-2">Present</p>
        <h3 className="text-3xl font-black text-success tracking-tighter">{stats.present}</h3>
      </div>
    </div>
  );
};

export default AttendanceStats;
