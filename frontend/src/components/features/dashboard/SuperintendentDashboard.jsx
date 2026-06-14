import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { AlertCircle, CheckCircle, Clock, FileBarChart, ClipboardList, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS = ['#10b981', 'oklch(48.8% 0.243 264.376)', 'oklch(90.5% 0.182 98.111)', 'oklch(57.7% 0.245 27.325)'];

const SuperintendentDashboard = ({ stats }) => {
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
        <div className="bg-white border-l-4 border-l-success shadow-md rounded-xl p-8 transition-all hover:shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-success/5 rounded-lg flex items-center justify-center text-success">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Loan Requests</p>
              <h2 className="text-2xl font-black text-base-content">{stats?.pending_loan_approvals || 0}</h2>
            </div>
          </div>
          <div className="badge badge-success badge-outline font-black text-[9px] px-3 uppercase">Pending Approval</div>
        </div>

        <div className="bg-white border-l-4 border-l-primary shadow-md rounded-xl p-8 transition-all hover:shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Leave Pipeline</p>
              <h2 className="text-2xl font-black text-base-content">{stats?.pending_leaves || 0}</h2>
            </div>
          </div>
          <div className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1 mt-1">
             <Clock className="w-3 h-3" /> Awaiting Action
          </div>
        </div>

        <div className="bg-white border-l-4 border-l-secondary shadow-md rounded-xl p-8 transition-all hover:shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-secondary/5 rounded-lg flex items-center justify-center text-secondary">
              <FileBarChart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">IPCRF Reviews</p>
              <h2 className="text-2xl font-black text-base-content">{stats?.pending_ipcrf || 0}</h2>
            </div>
          </div>
          <div className="badge badge-secondary badge-outline font-black text-[9px] px-3 uppercase">Unrated Staff</div>
        </div>

        <div className="bg-white border-l-4 border-l-error shadow-md rounded-xl p-8 transition-all hover:shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-error/5 rounded-lg flex items-center justify-center text-error">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Geo-Alerts</p>
              <h2 className="text-2xl font-black text-base-content">{stats?.attendance_alerts || 0}</h2>
            </div>
          </div>
          <div className="text-[10px] font-bold text-error uppercase tracking-widest flex items-center gap-1 mt-1 font-black">
             <AlertCircle className="w-3 h-3" /> Policy Violations
          </div>
        </div>
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-base-200 shadow-sm rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <PieChartIcon className="w-4 h-4 text-primary" />
            <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Performance Mix</h3>
          </div>
          <div className="h-[280px] w-full relative">
            {formattedPerf.length > 0 ? (
              <>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-[10px] font-black opacity-30 uppercase">RATINGS</span>
                   <span className="text-3xl font-black">
                      {formattedPerf.reduce((acc, curr) => acc + curr.value, 0)}
                   </span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formattedPerf}
                      innerRadius={75}
                      outerRadius={100}
                      paddingAngle={10}
                      dataKey="value"
                    >
                      {formattedPerf.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No rating data</div>
            )}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {formattedPerf.map((item, index) => (
              <div key={index} className="flex flex-col p-3 bg-base-50 rounded-xl border border-base-100 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                   <span className="text-[10px] font-bold opacity-60 uppercase tracking-wide">{item.name}</span>
                </div>
                <span className="text-lg font-black text-base-content">{item.value} Personnel</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-base-200 shadow-sm rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="w-4 h-4 text-secondary" />
            <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Institutional Presence</h3>
          </div>
          <div className="h-[280px] w-full">
            {formattedAtt.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedAtt} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
              <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No attendance data</div>
            )}
          </div>
          <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10">
             <p className="text-[10px] font-black text-primary uppercase mb-1">Takeaway</p>
             <p className="text-xs font-bold leading-relaxed opacity-70">
               Distribution of daily attendance across the division. High 'Present' counts indicate strong operational continuity.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperintendentDashboard;
