import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import { CalendarCheck, History } from 'lucide-react';

// Sub-components
import AttendanceStats from '../../components/features/attendance/AttendanceStats';
import AttendanceMap from '../../components/features/attendance/AttendanceMap';
import AttendanceLogs from '../../components/features/attendance/AttendanceLogs';

/**
 * Attendance Management (Admin/HR View)
 * 
 * Simple, professional redesign for monitoring staff check-ins.
 */
const AttendanceManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  
  const center = [13.9408, 121.6210]; // Lucena City Center

  // 1. Data Fetching
  const { data: records, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE],
    queryFn: async () => {
      const res = await api.get('attendance/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  // 2. Daily QR Fetch
  const { data: qrData } = useQuery({
    queryKey: ['daily-qr'],
    queryFn: async () => {
      const res = await api.get('attendance/get_daily_qr/');
      return res.data;
    },
    refetchInterval: 60000,
  });

  // 3. Filtering
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
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">Daily Records</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Monitor staff attendance and location</p>
        </div>

        <div className="w-full lg:w-auto animate-in fade-in duration-1000">
          <AttendanceStats stats={stats} />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Sidebar: Map & Proximity */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-base-200 overflow-hidden">
             <AttendanceMap 
                records={filteredRecords} 
                qrData={qrData} 
                center={center} 
             />
          </div>
        </div>

        {/* Main: Logs List */}
        <div className="xl:col-span-2">
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
      </div>
    </div>
  );
};

export default AttendanceManagement;
