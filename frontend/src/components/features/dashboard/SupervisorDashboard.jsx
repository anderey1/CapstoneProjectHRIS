import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { AlertCircle, CheckCircle, Clock, FileBarChart, ClipboardList, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS = ['#10b981', '#4f46e5', '#f59e0b', '#ef4444'];

const SupervisorDashboard = ({ stats }) => {
  const { data: perfData } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.PERFORMANCE],
    queryFn: () => api.get('analytics/performance/').then(res => res.data)
  });

  const { data: attendanceData } = useQuery({
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
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-accent/5 rounded-lg flex items-center justify-center text-accent">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Loans Pending Approval</p>
              <h2 className="text-2xl font-black text-base-content">{stats?.pending_loan_approvals || 0}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Pending Leaves</p>
              <h2 className="text-2xl font-black text-base-content">{stats?.pending_leaves || 0}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-secondary/5 rounded-lg flex items-center justify-center text-secondary">
              <FileBarChart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-30">IPCRF Pending</p>
              <h2 className="text-2xl font-black text-base-content">{stats?.pending_ipcrf || 0}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-error/5 rounded-lg flex items-center justify-center text-error">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Attendance Issues</p>
              <h2 className="text-2xl font-black text-base-content">{stats?.attendance_alerts || 0}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <PieChartIcon className="w-4 h-4 text-primary" />
            <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Performance Eligibility</h3>
          </div>
          <div className="h-[250px] w-full">
            {formattedPerf.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formattedPerf}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {formattedPerf.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No rating data</div>
            )}
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-6">
            {formattedPerf.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-tight opacity-60">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                {item.name}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="w-4 h-4 text-secondary" />
            <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Presence Distribution</h3>
          </div>
          <div className="h-[250px] w-full">
            {formattedAtt.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedAtt} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold' }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No attendance data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
