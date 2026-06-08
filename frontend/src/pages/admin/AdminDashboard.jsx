import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';
import AccountantDashboard from '../../components/features/dashboard/AccountantDashboard';
import SupervisorDashboard from '../../components/features/dashboard/SupervisorDashboard';
import {
  Users, Wallet, CalendarCheck, AlertCircle, Loader2, BarChart3, TrendingUp, PieChart as PieChartIcon, ShieldCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';


const COLORS = ['#0038a8', '#ffcd00', '#3b82f6', '#facc15', '#60a5fa'];

/**
 * Admin Home (Dashboard)
 * 
 * Simple, professional redesign with plain language labels and standard radius.
 */
const Dashboard = () => {
  // 1. Data Fetching
  const { user } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_STATS],
    queryFn: () => api.get('dashboard/').then(res => res.data)
  });

  const { data: deptData, isLoading: deptLoading } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.DEPARTMENT],
    queryFn: () => api.get('analytics/departments/').then(res => res.data)
  });

  const { data: loanData, isLoading: loanLoading } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.LOAN_STATUS],
    queryFn: () => api.get('analytics/loans/').then(res => res.data)
  });

  const { data: attData, isLoading: attLoading } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.ATTENDANCE_TRENDS],
    queryFn: () => api.get('analytics/attendance/').then(res => res.data)
  });

  const { data: recruitmentData } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.RECRUITMENT],
    queryFn: () => api.get('analytics/recruitment/').then(res => res.data)
  });

  const { data: leaveTypeData } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.LEAVE_TYPES],
    queryFn: () => api.get('analytics/leave/').then(res => res.data)
  });

  const { data: aiSummary } = useQuery({
    queryKey: ['dashboard-ai-summary'],
    queryFn: () => api.get('dashboard/summary/').then(res => res.data),
    refetchInterval: 600000 // 10 mins
  });

  const isLoading = statsLoading || deptLoading || loanLoading || attLoading;

  if (isLoading) return (
    <div className="p-8 flex justify-center h-[60vh] items-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  // Data Formatting
  const formattedLoanData = loanData?.map(item => ({
    name: item.status?.toUpperCase() || 'UNKNOWN',
    value: item.count
  })) || [];

  const formattedDeptData = deptData?.map(item => ({
    name: item.department || 'Other',
    count: item.count
  })) || [];

  const formattedAttData = attData?.map(item => ({
    name: item.status?.toUpperCase() || 'UNKNOWN',
    count: item.count
  })) || [];

  const formattedRecData = recruitmentData?.map(item => ({
    name: item.status?.toUpperCase() || 'UNKNOWN',
    count: item.count
  })) || [];

  const formattedLeaveData = leaveTypeData?.map(item => ({
    name: item.leave_type?.toUpperCase() || 'OTHER',
    value: item.count
  })) || [];

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">Home</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Daily system overview</p>
        </div>
      </div>

      {/* Gemini AI Summary Alert */}
      {aiSummary?.ai_summary && (
        <div className="bg-gradient-to-r from-primary to-secondary p-[1px] rounded-xl shadow-lg shadow-primary/10 group">
          <div className="bg-white rounded-[11px] p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
             <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0 animate-pulse">
                <ShieldCheck className="w-6 h-6" />
             </div>
             <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Gemini AI Executive Summary</h3>
                   <div className="badge badge-primary badge-outline text-[8px] font-black h-4 px-1">LIVE</div>
                </div>
                <p className="text-sm font-bold text-base-content leading-relaxed">
                   "{aiSummary.ai_summary}"
                </p>
             </div>
          </div>
        </div>
      )}

      {user?.role === 'ACCOUNTANT' ? (
        <AccountantDashboard stats={stats} />
      ) : user?.role === 'SUPERVISOR' ? (
        <SupervisorDashboard stats={stats} />
      ) : (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8 group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center text-primary border border-primary/5">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-1">Total Staff</p>
                  <h2 className="text-3xl font-black text-base-content">{stats?.total_employees || 0}</h2>
                </div>
              </div>
            </div>

            <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8 group hover:border-secondary/20 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/5 rounded-lg flex items-center justify-center text-secondary border border-secondary/5">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-1">Active Applicants</p>
                  <h2 className="text-3xl font-black text-base-content">{stats?.active_applicants || 0}</h2>
                </div>
              </div>
            </div>

            <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8 group hover:border-accent/20 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/5 rounded-lg flex items-center justify-center text-accent border border-accent/5">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-1">Pending Leaves</p>
                  <h2 className="text-3xl font-black text-base-content">{stats?.pending_leaves || 0}</h2>
                </div>
              </div>
            </div>

            <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8 group hover:border-warning/20 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-warning/5 rounded-lg flex items-center justify-center text-warning border border-warning/5">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-1">Payroll to Approve</p>
                  <h2 className="text-3xl font-black text-base-content">{stats?.pending_payroll_approval || 0}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Hiring Funnel */}
            <div className="lg:col-span-2 bg-white border border-base-200 shadow-sm rounded-xl p-8">
              <div className="flex items-center gap-3 mb-8">
                 <BarChart3 className="w-4 h-4 text-secondary" />
                 <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Hiring Pipeline</h3>
              </div>
              <div className="h-[300px] w-full">
                {formattedRecData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedRecData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold' }} />
                      <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No active applications</div>
                )}
              </div>
            </div>

            {/* Leave Mix */}
            <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
              <div className="flex items-center gap-3 mb-8">
                 <PieChartIcon className="w-4 h-4 text-accent" />
                 <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Leave Utilization</h3>
              </div>
              <div className="h-[250px] w-full">
                {formattedLeaveData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formattedLeaveData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {formattedLeaveData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No leave data</div>
                )}
              </div>
              <div className="flex flex-wrap gap-4 justify-center mt-6">
                {formattedLeaveData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-tight opacity-60">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    {item.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Distribution */}
            <div className="lg:col-span-2 bg-white border border-base-200 shadow-sm rounded-xl p-8">
              <div className="flex items-center gap-3 mb-8">
                 <BarChart3 className="w-4 h-4 text-primary" />
                 <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Staff by Area</h3>
              </div>
              <div className="h-[300px] w-full">
                {formattedDeptData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedDeptData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold' }} />
                      <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No data available</div>
                )}
              </div>
            </div>

            {/* Loan Health */}
            <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
              <div className="flex items-center gap-3 mb-8">
                 <PieChartIcon className="w-4 h-4 text-secondary" />
                 <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Loan Status</h3>
              </div>
              <div className="h-[250px] w-full">
                {formattedLoanData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formattedLoanData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {formattedLoanData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No data available</div>
                )}
              </div>
              <div className="flex flex-wrap gap-4 justify-center mt-6">
                {formattedLoanData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-tight opacity-60">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    {item.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Area */}
            <div className="lg:col-span-3 bg-white border border-base-200 shadow-sm rounded-xl p-8">
              <div className="flex items-center gap-3 mb-8">
                 <CalendarCheck className="w-4 h-4 text-accent" />
                 <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Presence Summary</h3>
              </div>
              <div className="h-[200px] w-full">
                {formattedAttData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedAttData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No data available</div>
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
