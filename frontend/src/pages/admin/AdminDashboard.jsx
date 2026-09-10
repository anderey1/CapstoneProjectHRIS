import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { AccountantDashboard, SuperintendentDashboard } from '../../features/dashboard';
import {
  Users, Wallet, CalendarCheck, AlertCircle, BarChart3, TrendingUp,
  PieChart as PieChartIcon, ShieldCheck, School, CheckCircle2,
  Clock, ArrowUpRight, ChevronRight, FileText
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

const COLORS = [
  '#0038A8', // DepEd Blue (Primary)
  '#FDB913', // DepEd Yellow (Secondary)
  '#CE1126', // DepEd Red (Accent)
  '#2563EB', // Blue variant
  '#10B981', // Emerald variant
  '#8B5CF6', // Purple variant
];

const LEAVE_TYPE_LABELS = {
  vacation: 'Vacation Leave',
  'vacation leave': 'Vacation Leave',
  forced: 'Mandatory/Forced Leave',
  'mandatory/forced leave': 'Mandatory/Forced Leave',
  sick: 'Sick Leave',
  'sick leave': 'Sick Leave',
  maternity: 'Maternity Leave',
  'maternity leave': 'Maternity Leave',
  paternity: 'Paternity Leave',
  'paternity leave': 'Paternity Leave',
  special_privilege: 'Special Privilege Leave',
  'special privilege leave': 'Special Privilege Leave',
  solo_parent: 'Solo Parent Leave',
  'solo parent leave': 'Solo Parent Leave',
  study: 'Study Leave',
  'study leave': 'Study Leave',
  vawc: '10-Day VAWC Leave',
  '10-day vawc leave': '10-Day VAWC Leave',
  rehabilitation: 'Rehabilitation Privilege',
  'rehabilitation privilege': 'Rehabilitation Privilege',
  women_special: 'Special Leave Benefits for Women',
  'special leave benefits for women': 'Special Leave Benefits for Women',
  emergency: 'Special Emergency (Calamity) Leave',
  'special emergency (calamity) leave': 'Special Emergency (Calamity) Leave',
  adoption: 'Adoption Leave',
  'adoption leave': 'Adoption Leave',
  others: 'Others',
  'others leave': 'Others'
};

const AdminDashboard = () => {
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

  const { data: schoolsData } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.SCHOOLS],
    queryFn: () => api.get('analytics/schools/').then(res => res.data)
  });

  const isLoading = statsLoading || deptLoading || loanLoading || attLoading;

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center h-[60vh] items-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // Format Chart Data
  const formattedLoanData = loanData?.map(item => ({
    name: item.status?.toUpperCase() || 'UNKNOWN',
    value: item.count
  })) || [];

  const formattedSchoolsData = (schoolsData || stats?.schools_breakdown || [])?.map(item => ({
    name: item.name,
    count: item.count ?? item.employee_count ?? 0
  }));

  const staffMixData = [
    { name: 'Teaching', value: stats?.teaching_count || 0 },
    { name: 'Non-Teaching', value: stats?.non_teaching_count || 0 },
    { name: 'Administrative', value: stats?.administrative_count || 0 },
  ].filter(d => d.value > 0);

  const normalizeText = (value) => {
    if (!value) return '';
    return String(value).replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const formatReadableLabel = (value) => {
    const text = normalizeText(value);
    if (!text) return '';
    return text
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const formattedAttData = attData?.map(item => ({
    name: formatReadableLabel(item.status) || 'Unknown',
    count: item.count
  })) || [];

  const formattedRecData = recruitmentData?.map(item => ({
    name: formatReadableLabel(item.status) || 'Unknown',
    count: item.count
  })) || [];

  const formattedTeachingLeaveData = leaveTypeData?.teaching?.map(item => ({
    name: LEAVE_TYPE_LABELS[item.leave_type?.toLowerCase()] || item.leave_type?.toUpperCase() || 'OTHER',
    value: Number(item.count) || 0
  })) || [];

  const formattedNonTeachingLeaveData = leaveTypeData?.non_teaching?.map(item => ({
    name: LEAVE_TYPE_LABELS[item.leave_type?.toLowerCase()] || item.leave_type?.toUpperCase() || 'OTHER',
    value: Number(item.count) || 0
  })) || [];

  return (
    <div className="p-4 md:p-8 space-y-8">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-base-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
                Executive Operations Dashboard
              </h1>
              <p className="text-xs font-semibold text-slate-500 tracking-wide">
                DepEd Schools Division of Lucena City • Real-time Monitoring & Decision Center
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-outline font-semibold py-2.5 px-3 text-xs text-slate-700 bg-slate-50 border-slate-200 gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Division Operations Active
          </span>
          <span className="badge badge-outline font-semibold py-2.5 px-3 text-xs text-slate-600">
            5 Active Stations
          </span>
        </div>
      </div>

      {user?.role === 'ACCOUNTANT' ? (
        <AccountantDashboard stats={stats} />
      ) : user?.role === 'SUPERINTENDENT' ? (
        <SuperintendentDashboard stats={stats} />
      ) : (
        <>
          {/* Top Operational KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* KPI 1: Workforce Deployment */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Workforce Headcount</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <h2 className="text-3xl font-black text-slate-900">{stats?.total_employees || 0}</h2>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {stats?.insights?.workforce?.status || 'Active'}
                      </span>
                    </div>
                  </div>
                  <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <p className="mt-2.5 text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  Division personnel deployed across 5 cluster stations and SDO administrative divisions.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span>{stats?.teaching_count || 0} Teaching</span>
                <span>•</span>
                <span>{stats?.non_teaching_count || 0} Non-Teaching</span>
                <span>•</span>
                <span>{stats?.administrative_count || 0} Admin</span>
              </div>
            </div>

            {/* KPI 2: Station Deployment */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cluster Schools</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <h2 className="text-3xl font-black text-slate-900">{formattedSchoolsData.length || 5}</h2>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        Stations
                      </span>
                    </div>
                  </div>
                  <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <School className="w-5 h-5" />
                  </div>
                </div>
                <p className="mt-2.5 text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  All 5 division cluster stations actively monitored with complete faculty staffing coverage.
                </p>
              </div>
              <p className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-medium text-slate-600 truncate">
                South 1, West 1, North 1, East 1, LCNHS
              </p>
            </div>

            {/* KPI 3: Geofence & Attendance */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Geofence Compliance</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <h2 className="text-3xl font-black text-slate-900">{stats?.geo_compliance_rate || 100}%</h2>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        (stats?.attendance_alerts || 0) > 0 ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'
                      }`}>
                        {stats?.insights?.attendance?.status || ((stats?.attendance_alerts || 0) > 0 ? 'Alerts' : 'Verified')}
                      </span>
                    </div>
                  </div>
                  <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <p className="mt-2.5 text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  {stats?.insights?.attendance?.summary || 'Geofence verification ensures employee time stamps are securely validated within school boundaries.'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> 150m GPS radius
                </span>
                <span className="font-semibold text-slate-700">
                  {stats?.attendance_alerts || 0} flagged alert(s)
                </span>
              </div>
            </div>

            {/* KPI 4: Pending Action Queue */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Action Queue</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <h2 className="text-3xl font-black text-amber-600">{stats?.pending_action_total || 0}</h2>
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        Bottlenecks
                      </span>
                    </div>
                  </div>
                  <div className="w-11 h-11 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
                <p className="mt-2.5 text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  Items requiring administrative review across Principal, HR, Accountant, and SDS approval steps.
                </p>
              </div>
              <p className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-medium text-slate-600">
                {stats?.pending_leaves || 0} Leaves • {(stats?.pending_loan_approvals || 0) + (stats?.pending_loan_verification || 0)} Loans • {stats?.pending_payroll_approval || 0} Payroll
              </p>
            </div>

          </div>


          {/* Visual Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* School Stations Personnel Distribution */}
            <div className="lg:col-span-8 bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                      <School className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        Personnel Distribution Across Stations
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Active faculty and staff deployed in South 1, West 1, North 1, East 1, LCNHS & SDO
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-ghost text-xs font-semibold">Live Registry</span>
                </div>

                <div className="h-[280px] w-full">
                  {formattedSchoolsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={formattedSchoolsData} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} 
                          axisLine={false} 
                          tickLine={false} 
                          allowDecimals={false}
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(0, 56, 168, 0.04)' }}
                          contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} 
                        />
                        <Bar dataKey="count" fill="#0038A8" radius={[6, 6, 0, 0]} barSize={36}>
                          {formattedSchoolsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                      No school deployment data recorded
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Cluster Station Breakdown:</span>
                  <div className="flex flex-wrap items-center gap-3">
                    {formattedSchoolsData.map((s, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        {s.name}: <strong className="text-slate-900">{s.count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contextual Executive Insight for Workforce Distribution */}
              <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <div className="p-1.5 bg-[#0038A8] text-white rounded-lg shrink-0 mt-0.5 shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-900">
                      Executive Insight • Workforce & Station Deployment
                    </span>
                    <span className="badge badge-success text-[10px] font-bold py-1">
                      {stats?.insights?.workforce?.status || 'Optimal Deployment'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {stats?.insights?.workforce?.summary || 
                      `Personnel are distributed across cluster schools (South 1, West 1, North 1, East 1, LCNHS) maintaining proper teacher-to-student operational coverage.`}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>5 cluster schools actively staffed across Lucena City division</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Role Breakdown (Donut Chart) */}
            <div className="lg:col-span-4 bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Workforce Composition
                    </h3>
                    <p className="text-[11px] text-slate-500">Teaching vs Support Staff Mix</p>
                  </div>
                </div>

                <div className="h-[200px] w-full relative">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</span>
                    <span className="text-2xl font-black text-slate-900">{stats?.total_employees || 0}</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={staffMixData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {staffMixData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0038A8]" />
                      Teaching Faculty
                    </span>
                    <strong className="text-slate-900">{stats?.teaching_count || 0} ({stats?.total_employees ? Math.round((stats.teaching_count / stats.total_employees) * 100) : 0}%)</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FDB913]" />
                      Non-Teaching Personnel
                    </span>
                    <strong className="text-slate-900">{stats?.non_teaching_count || 0} ({stats?.total_employees ? Math.round((stats.non_teaching_count / stats.total_employees) * 100) : 0}%)</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#CE1126]" />
                      Administrative Staff
                    </span>
                    <strong className="text-slate-900">{stats?.administrative_count || 0} ({stats?.total_employees ? Math.round((stats.administrative_count / stats.total_employees) * 100) : 0}%)</strong>
                  </div>
                </div>
              </div>

              {/* Contextual Micro-Insight for Staff Mix */}
              <div className="mt-4 p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-slate-700">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-1">
                  <Users className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>Deployment Ratio Insight</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Teaching positions prioritize direct classroom delivery at {stats?.total_employees ? Math.round((stats.teaching_count / stats.total_employees) * 100) : 0}%, supported by administrative division operations.
                </p>
              </div>
            </div>

            {/* Leave Allocations Card */}
            <div className="lg:col-span-7 bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        Civil Service Leave Allocations
                      </h3>
                      <p className="text-[11px] text-slate-500">Statutory vs Vacation/Sick Leave Requests</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Most Used: {stats?.most_used_leave || 'None'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-50 p-2 rounded-lg text-center">
                      Teaching Staff Leaves ({formattedTeachingLeaveData.reduce((a, c) => a + c.value, 0)})
                    </h4>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {formattedTeachingLeaveData.length > 0 ? (
                        formattedTeachingLeaveData.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="font-medium text-slate-700 truncate pr-2">{item.name}</span>
                            <span className="font-bold text-blue-700 shrink-0">{item.value} request(s)</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-4">No teaching leaves recorded</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-50 p-2 rounded-lg text-center">
                      Non-Teaching Leaves ({formattedNonTeachingLeaveData.reduce((a, c) => a + c.value, 0)})
                    </h4>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {formattedNonTeachingLeaveData.length > 0 ? (
                        formattedNonTeachingLeaveData.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="font-medium text-slate-700 truncate pr-2">{item.name}</span>
                            <span className="font-bold text-amber-700 shrink-0">{item.value} request(s)</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-4">No non-teaching leaves recorded</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contextual Executive Insight for Leaves */}
              <div className="mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <div className="p-1.5 bg-emerald-700 text-white rounded-lg shrink-0 mt-0.5 shadow-sm">
                  <CalendarCheck className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900">
                      Executive Insight • Leave Approval Routing
                    </span>
                    <span className="badge badge-outline text-[10px] font-bold text-emerald-800 border-emerald-300">
                      {stats?.pending_leaves || 0} Pending
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Most requested statutory leave is <strong className="text-slate-900">{stats?.most_used_leave || 'None'}</strong>. Applications route systematically through Principal recommendation ({stats?.pending_leaves_supervisor || 0}), HR certification ({stats?.pending_leaves_hr || 0}), and Superintendent sign-off ({stats?.pending_leaves_superintendent || 0}).
                  </p>
                </div>
              </div>
            </div>

            {/* Provident Fund Status */}
            <div className="lg:col-span-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        Provident Loan Portfolio
                      </h3>
                      <p className="text-[11px] text-slate-500">Application Pipeline & Disbursed Total</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                    ₱{stats?.total_loan_portfolio || '0.00'}
                  </span>
                </div>

                <div className="h-[180px] w-full relative">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Loans</span>
                    <span className="text-2xl font-black text-slate-900">{stats?.total_loans || 0}</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formattedLoanData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {formattedLoanData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap gap-2 justify-center pt-3 border-t border-slate-100">
                  {formattedLoanData.map((item, idx) => (
                    <span key={idx} className="badge badge-ghost text-[10px] font-semibold gap-1.5 py-2.5 px-3">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(idx + 2) % COLORS.length] }} />
                      {item.name}: <strong>{item.value}</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Contextual Executive Insight for Provident Fund */}
              <div className="mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <div className="p-1.5 bg-[#0038A8] text-white rounded-lg shrink-0 mt-0.5 shadow-sm">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-900">
                      Executive Insight • Fiscal Welfare
                    </span>
                    <span className="badge badge-info badge-sm text-[10px] font-bold">
                      {stats?.insights?.finance?.status || 'Healthy Portfolio'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {stats?.insights?.finance?.summary || 
                      `Provident Fund loan repayments are directly automated via bi-monthly payroll amortizations, maintaining financial stability for division personnel.`}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-purple-700">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Amortizations deducted automatically via bi-monthly payroll</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hiring Pipeline */}
            <div className="lg:col-span-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Registry of Qualified Applicants (RQA) Funnel
                    </h3>
                    <p className="text-[11px] text-slate-500">Recruitment stages for teaching & non-teaching positions</p>
                  </div>
                </div>
                <span className="badge badge-outline text-xs font-semibold">
                  {stats?.active_applicants || 0} Active Candidates
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {formattedRecData.map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.name}</span>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900">{item.count}</span>
                      <span className="text-[10px] font-semibold text-blue-600">Candidates</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contextual Executive Insight for Recruitment */}
              <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <div className="p-1.5 bg-[#0038A8] text-white rounded-lg shrink-0 mt-0.5 shadow-sm">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                      Executive Insight • RQA Recruitment Pipeline
                    </span>
                    <span className="badge badge-ghost text-[10px] font-bold">
                      {stats?.active_applicants || 0} Candidates in Funnel
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Applicant evaluation enforces DepEd Division Order No. 7 standards across 5 qualification stages. Candidates reaching the final stage qualify for immediate deployment to cluster stations.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
