import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { AlertCircle, CheckCircle, Clock, FileBarChart, ClipboardList, PieChart as PieChartIcon, BarChart3, Loader2 } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const CHART_COLORS = ['#0038A8', '#0A225C', '#15803D', '#B45309'];

const SuperintendentDashboard = ({ stats }) => {
  const { data: perfData, isLoading: perfLoading, isError: perfError } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.PERFORMANCE],
    queryFn: () => api.get('analytics/performance/').then(res => res.data)
  });

  const { data: attendanceData, isLoading: attLoading, isError: attError } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.ATTENDANCE_TRENDS],
    queryFn: () => api.get('analytics/attendance/').then(res => res.data)
  });

  const formattedPerf = perfData?.map(item => ({
    name: item.is_promotion_eligible ? 'ELIGIBLE' : 'REGULAR',
    value: item.count
  })) || [];

  const formattedAtt = attendanceData?.map(item => ({
    name: item.status?.toUpperCase() || 'UNKNOWN',
    count: item.count
  })) || [];

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Loan Requests */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Loan Requests</span>
            <span className="p-2 bg-slate-100 rounded-md text-[#0038A8]">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {stats?.pending_loan_approvals ?? 0}
            </span>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              Pending Approval
            </span>
          </div>
        </div>

        {/* Card 2: Leave Pipeline */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Leave Pipeline</span>
            <span className="p-2 bg-slate-100 rounded-md text-[#0038A8]">
              <ClipboardList className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {stats?.pending_leaves ?? 0}
            </span>
            <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1">
              <Clock className="w-3 h-3" /> Awaiting Action
            </span>
          </div>
        </div>

        {/* Card 3: IPCRF Reviews */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">IPCRF Reviews</span>
            <span className="p-2 bg-slate-100 rounded-md text-[#0038A8]">
              <FileBarChart className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {stats?.pending_ipcrf ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              Unrated Staff
            </span>
          </div>
        </div>

        {/* Card 4: Attendance Policy Alerts */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Attendance Alerts</span>
            <span className="p-2 bg-red-50 rounded-md text-red-700">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {stats?.attendance_alerts ?? 0}
            </span>
            <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded flex items-center gap-1">
              Policy Exceptions
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Distribution */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-[#0038A8]" />
              <h3 className="text-sm font-semibold text-slate-900">Performance Rating Mix (IPCRF)</h3>
            </div>
            <span className="text-xs text-slate-500">Division Overview</span>
          </div>

          <div className="h-[260px] w-full relative">
            {perfLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#0038A8]" />
                <span className="text-xs">Loading performance data...</span>
              </div>
            ) : perfError ? (
              <div className="h-full flex items-center justify-center text-red-600 text-xs gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Unable to load performance metrics</span>
              </div>
            ) : formattedPerf.length > 0 ? (
              <>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Rated</span>
                  <span className="text-2xl font-bold text-slate-900 tabular-nums">
                    {formattedPerf.reduce((acc, curr) => acc + curr.value, 0)}
                  </span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formattedPerf}
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {formattedPerf.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No submitted IPCRF evaluations found for the active cycle.
              </div>
            )}
          </div>

          {/* Performance Legend */}
          <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            {formattedPerf.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                  <span className="text-xs font-medium text-slate-700">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-900 tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Distribution */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0038A8]" />
              <h3 className="text-sm font-semibold text-slate-900">Today's Attendance Status</h3>
            </div>
            <span className="text-xs text-slate-500">Live Scans</span>
          </div>

          <div className="h-[260px] w-full">
            {attLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#0038A8]" />
                <span className="text-xs">Loading attendance data...</span>
              </div>
            ) : attError ? (
              <div className="h-full flex items-center justify-center text-red-600 text-xs gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Unable to load attendance records</span>
              </div>
            ) : formattedAtt.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedAtt} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '12px' }} 
                  />
                  <Bar dataKey="count" fill="#0038A8" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No attendance logs recorded for the current shift.
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-100 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Operational Continuity:</span> Real-time aggregate count of biometric/QR scans logged today.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperintendentDashboard;
