import React, { useState } from 'react';
import { QUERY_KEYS } from '../../api/queryKeys';
import { History, ShieldCheck } from 'lucide-react';

// Sub-components
import AttendanceLogs from '../../components/features/attendance/AttendanceLogs';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import Pagination from '../../components/common/Pagination';

/**
 * Division Attendance Monitoring Console (Admin/HR View)
 * Tracks real-time biometric and station check-ins across division personnel.
 */
const AttendanceManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // 1. Data Fetching
  const [year, month] = selectedMonth.split('-');
  const { records: filteredRecords, summary, pagination, isLoading } = usePaginatedList(QUERY_KEYS.ATTENDANCE, 'attendance/', {
    search: searchTerm, department: deptFilter, flagged: String(flaggedOnly), year, month,
  });
  const totalLogs = pagination.count;
  const presentCount = summary.present || 0;
  const flaggedCount = summary.flagged || 0;
  const lateCount = summary.late || 0;

  if (isLoading) return (
    <div className="p-8 flex justify-center h-[60vh] items-center text-primary">
      <span className="loading loading-spinner loading-lg text-[#0038A8]"></span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center text-[#0038A8]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                Division Attendance Monitoring Console
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-Time Personnel Verification • Daily Log Monitoring • Schools Division of Lucena City
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Biometric & Station Logging Active
          </span>
        </div>
      </div>

      {/* 4-Metric Status Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Check-Ins</p>
          <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">{totalLogs}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Filtered division logs</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Present On Time</p>
          <p className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-1">{presentCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Standard arrival verified</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tardy / Late</p>
          <p className="text-xl font-bold text-amber-700 font-mono tabular-nums mt-1">{lateCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Subject to undertime tracking</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location Flagged</p>
          <p className="text-xl font-bold text-rose-700 font-mono tabular-nums mt-1">{flaggedCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Outside designated station</p>
        </div>
      </div>

      {/* Staff Attendance Monitor */}
      <div className="w-full">
        <AttendanceLogs 
          records={filteredRecords}
          isLoading={isLoading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          deptFilter={deptFilter}
          setDeptFilter={setDeptFilter}
          flaggedOnly={flaggedOnly}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          setFlaggedOnly={setFlaggedOnly}
        />
        <Pagination pagination={pagination} label="attendance records" />
      </div>
    </div>
  );
};

export default AttendanceManagement;
