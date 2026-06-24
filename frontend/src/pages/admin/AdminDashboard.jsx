import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';
import AccountantDashboard from '../../components/features/dashboard/AccountantDashboard';
import SuperintendentDashboard from '../../components/features/dashboard/SuperintendentDashboard';
import {
  Users, Wallet, CalendarCheck, AlertCircle, Loader2, BarChart3, TrendingUp, PieChart as PieChartIcon, ShieldCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';


const COLORS = [
  'oklch(48.8% 0.243 264.376)', // Primary
  'oklch(90.5% 0.182 98.111)', // Secondary
  'oklch(57.7% 0.245 27.325)', // Accent
  'oklch(85% 0.2 90)',          // Variant for yellow
  'oklch(70% 0.15 250)'         // Variant for blue
];

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

  const formattedTeachingLeaveData = leaveTypeData?.teaching?.map(item => ({
    name: item.leave_type?.toUpperCase() || 'OTHER',
    value: Number(item.count) || 0
  })) || [];

  const formattedNonTeachingLeaveData = leaveTypeData?.non_teaching?.map(item => ({
    name: item.leave_type?.toUpperCase() || 'OTHER',
    value: Number(item.count) || 0
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


      {user?.role === 'ACCOUNTANT' ? (
        <AccountantDashboard stats={stats} />
      ) : user?.role === 'SUPERINTENDENT' ? (
        <SuperintendentDashboard stats={stats} />
      ) : (
        <>
          {/* Enhanced KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border-l-4 border-l-primary shadow-md rounded-xl p-6 transition-all hover:shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest opacity-60 mb-1">Workforce</p>
                  <h2 className="text-4xl font-black text-base-content tracking-tight">{stats?.total_employees || 0}</h2>
                  <p className="text-[10px] font-bold text-success mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Total Active Staff
                  </p>
                </div>
                <div className="p-3 bg-primary/5 rounded-xl text-primary">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white border-l-4 border-l-secondary shadow-md rounded-xl p-6 transition-all hover:shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest opacity-60 mb-1">Recruitment</p>
                  <h2 className="text-4xl font-black text-base-content tracking-tight">{stats?.active_applicants || 0}</h2>
                  <p className="text-[10px] font-bold text-secondary mt-2">Active Hiring Funnel</p>
                </div>
                <div className="p-3 bg-secondary/5 rounded-xl text-secondary">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white border-l-4 border-l-accent shadow-md rounded-xl p-6 transition-all hover:shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest opacity-60 mb-1">Leave Requests</p>
                  <h2 className="text-4xl font-black text-base-content tracking-tight">{stats?.pending_leaves || 0}</h2>
                  <p className="text-[10px] font-bold text-warning mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Awaiting Action
                  </p>
                </div>
                <div className="p-3 bg-accent/5 rounded-xl text-accent">
                  <CalendarCheck className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white border-l-4 border-l-warning shadow-md rounded-xl p-6 transition-all hover:shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest opacity-60 mb-1">Payroll Cycle</p>
                  <h2 className="text-4xl font-black text-base-content tracking-tight">{stats?.pending_payroll_approval || 0}</h2>
                  <p className="text-[10px] font-bold text-error mt-2 italic">Pending HR Review</p>
                </div>
                <div className="p-3 bg-warning/5 rounded-xl text-warning">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Visual Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Hiring Funnel */}
            <div className="lg:col-span-8 bg-white border border-base-200 shadow-sm rounded-2xl p-8">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-secondary" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Hiring Funnel Stage</h3>
                 </div>
                 <span className="badge badge-secondary badge-outline font-black text-[9px] px-3">LIVE UPDATES</span>
              </div>
              <div className="h-[300px] w-full">
                {formattedRecData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={formattedRecData} 
                      layout="vertical" 
                      margin={{ top: 0, right: 30, left: 120, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.05} />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fontSize: 10, fontWeight: 700, fill: 'oklch(var(--bc))' }} 
                        axisLine={false} 
                        tickLine={false}
                        width={110}
                      />
                      <Tooltip 
                        cursor={false} 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold', backgroundColor: 'white' }} 
                      />
                      <Bar 
                        dataKey="count" 
                        fill="oklch(57.7% 0.245 27.325)" 
                        radius={[0, 8, 8, 0]} 
                        barSize={28}
                        activeBar={{ fill: 'oklch(57.7% 0.245 27.325)' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-2">
                    <BarChart3 className="w-12 h-12" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No active applications</p>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-6 border-t border-base-100 flex items-center gap-4 text-[10px] font-bold opacity-50 uppercase tracking-widest">
                <TrendingUp className="w-4 h-4 text-secondary" />
                Showing distribution of applicants across recruitment stages
              </div>
            </div>

            {/* Leave Allocations */}
            <div className="lg:col-span-12 bg-white border border-base-200 shadow-sm rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-8">
                 <PieChartIcon className="w-4 h-4 text-accent" />
                 <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Leave Allocations</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Teaching Staff Leaves */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#0038A8] text-center bg-blue-50/50 py-2 rounded-lg">Teaching Staff Leaves</h4>
                  <div className="h-[220px] w-full relative">
                    {formattedTeachingLeaveData.length > 0 ? (
                      <>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[9px] font-black opacity-30 uppercase">Total</span>
                          <span className="text-2xl font-black">
                            {formattedTeachingLeaveData.reduce((acc, curr) => acc + curr.value, 0)}
                          </span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={formattedTeachingLeaveData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={6}
                              dataKey="value"
                            >
                              {formattedTeachingLeaveData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No active teaching leaves</div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {formattedTeachingLeaveData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-1.5 bg-base-50 rounded-lg">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <div className="truncate">
                          <p className="text-[9px] font-bold opacity-60 uppercase truncate">{item.name}</p>
                          <p className="text-xs font-black text-base-content">{item.value} Employee(s)</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Non-Teaching Staff Leaves */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#0038A8] text-center bg-blue-50/50 py-2 rounded-lg">Non-Teaching Staff Leaves</h4>
                  <div className="h-[220px] w-full relative">
                    {formattedNonTeachingLeaveData.length > 0 ? (
                      <>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[9px] font-black opacity-30 uppercase">Total</span>
                          <span className="text-2xl font-black">
                            {formattedNonTeachingLeaveData.reduce((acc, curr) => acc + curr.value, 0)}
                          </span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={formattedNonTeachingLeaveData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={6}
                              dataKey="value"
                            >
                              {formattedNonTeachingLeaveData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} strokeWidth={0} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No active non-teaching leaves</div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {formattedNonTeachingLeaveData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-1.5 bg-base-50 rounded-lg">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }}></div>
                        <div className="truncate">
                          <p className="text-[9px] font-bold opacity-60 uppercase truncate">{item.name}</p>
                          <p className="text-xs font-black text-base-content">{item.value} Employee(s)</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Staff Distribution */}
            <div className="lg:col-span-7 bg-white border border-base-200 shadow-sm rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-8">
                 <Users className="w-4 h-4 text-primary" />
                 <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Department Deployment</h3>
              </div>
              <div className="h-[300px] w-full">
                {formattedDeptData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedDeptData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={false} 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold', backgroundColor: 'white' }} 
                      />
                      <Bar dataKey="count" fill="oklch(48.8% 0.243 264.376)" radius={[8, 8, 0, 0]} barSize={40} activeBar={{ fill: 'oklch(48.8% 0.243 264.376)' }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No workforce data</div>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-primary bg-primary/5 p-3 rounded-xl border border-primary/10">
                 <ShieldCheck className="w-4 h-4" />
                 Workforce is distributed across {formattedDeptData.length} key departments
              </div>
            </div>

            {/* Loan Health */}
            <div className="lg:col-span-5 bg-white border border-base-200 shadow-sm rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-8">
                 <Wallet className="w-4 h-4 text-secondary" />
                 <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Provident Loan Status</h3>
              </div>
              <div className="h-[280px] w-full relative">
                {formattedLoanData.length > 0 ? (
                  <>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Active</span>
                       <span className="text-3xl font-black text-secondary">
                          {formattedLoanData.reduce((acc, curr) => acc + curr.value, 0)}
                       </span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={formattedLoanData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {formattedLoanData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold', backgroundColor: 'white' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No loan activity</div>
                )}
              </div>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                 {formattedLoanData.map((item, index) => (
                    <div key={index} className="badge badge-ghost font-black text-[9px] gap-2 py-3 px-4 border border-base-200">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(index + 1) % COLORS.length] }}></div>
                       {item.name}: {item.value}
                    </div>
                 ))}
              </div>
            </div>

            {/* Attendance Area */}
            <div className="lg:col-span-12 bg-white border border-base-200 shadow-sm rounded-2xl p-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
              <div className="flex items-center justify-between mb-10 relative z-10">
                 <div className="flex items-center gap-3">
                    <CalendarCheck className="w-4 h-4 text-accent" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Presence Monitoring</h3>
                 </div>
              </div>
              <div className="h-[250px] w-full relative z-10">
                {formattedAttData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedAttData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(57.7% 0.245 27.325)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="oklch(57.7% 0.245 27.325)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={false}
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold', backgroundColor: 'white' }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="oklch(57.7% 0.245 27.325)" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorCount)" 
                        activeDot={{ r: 6, strokeWidth: 0, fill: 'oklch(57.7% 0.245 27.325)' }}
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No daily activity recorded</div>
                )}
              </div>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                 <div className="p-4 bg-base-50 rounded-xl border border-base-100">
                    <p className="text-[9px] font-black opacity-30 uppercase mb-1">Observation</p>
                    <p className="text-xs font-bold leading-relaxed">System monitoring shows current attendance patterns across staff categories.</p>
                 </div>
                 <div className="p-4 bg-error/5 rounded-xl border border-error/10">
                    <p className="text-[9px] font-black text-error uppercase mb-1">Action Required</p>
                    <p className="text-xs font-bold leading-relaxed text-error/80">{stats?.attendance_alerts || 0} geofencing alerts require review by administrative staff.</p>
                 </div>
                 <div className="p-4 bg-success/5 rounded-xl border border-success/10">
                    <p className="text-[9px] font-black text-success uppercase mb-1">Status</p>
                    <p className="text-xs font-bold leading-relaxed text-success/80">Attendance verification system is active and geofencing is operational.</p>
                 </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
