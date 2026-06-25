import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import { History, Clock } from 'lucide-react';
import Attendance from '../shared/Attendance';

// Sub-components
import AttendanceStats from '../../components/features/attendance/AttendanceStats';
import AttendanceLogs from '../../components/features/attendance/AttendanceLogs';

/**
 * Attendance Management (Admin/HR View)
 * 
 * Simple, professional redesign for monitoring staff check-ins.
 */
const AttendanceManagement = () => {
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' or 'clock-in'
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  // 1. Data Fetching
  const { data: records, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE],
    queryFn: async () => {
      const res = await api.get('attendance/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  // 2. Filtering
  const filteredRecords = (records || [])?.filter(rec => {
    const matchesSearch = (rec.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' || rec.department === deptFilter;
    const matchesFlag = !flaggedOnly || rec.is_geo_flagged;
    return matchesSearch && matchesDept && matchesFlag;
  });

  const stats = {
    total: filteredRecords?.length || 0,
    flagged: filteredRecords?.filter(r => r.is_geo_flagged).length || 0,
    present: filteredRecords?.filter(r => r.status === 'present').length || 0,
  };

  if (isLoading) return (
    <div className="p-8 flex justify-center h-[60vh] items-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">DTR & Attendance Approvals</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Track staff attendance logs and approve employee DTRs</p>
        </div>

        {activeTab === 'monitor' && (
          <div className="w-full lg:w-auto animate-in fade-in duration-1000">
            <AttendanceStats stats={stats} />
          </div>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex gap-2 bg-base-200/50 p-1 rounded-xl w-fit border border-base-200 overflow-x-auto no-scrollbar max-w-full">
        <button
          type="button"
          className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'monitor' ? 'bg-white text-primary shadow-sm' : 'opacity-40 hover:opacity-100'}`}
          onClick={() => setActiveTab('monitor')}
        >
          <History className="w-3.5 h-3.5" />
          Monitor Staff
        </button>
        <button
          type="button"
          className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'clock-in' ? 'bg-white text-primary shadow-sm' : 'opacity-40 hover:opacity-100'}`}
          onClick={() => setActiveTab('clock-in')}
        >
          <Clock className="w-3.5 h-3.5" />
          My Clock In / Out
        </button>
      </div>

      {/* Conditional Content rendering */}
      {activeTab === 'monitor' ? (
        <div className="w-full">
          <AttendanceLogs 
            records={filteredRecords}
            isLoading={isLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            deptFilter={deptFilter}
            setDeptFilter={setDeptFilter}
            flaggedOnly={flaggedOnly}
            setFlaggedOnly={setFlaggedOnly}
          />
        </div>
      ) : (
        <div className="w-full animate-in fade-in duration-300">
          <Attendance />
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;
