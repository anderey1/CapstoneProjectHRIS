import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { 
  User, Wallet, CalendarCheck, Clock, Award, ChevronRight, ArrowRight, Sparkles, MapPin, BarChart3, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

/**
 * Employee Home (Dashboard)
 * 
 * Simple, professional redesign for staff overview and quick actions.
 */
const EmployeeDashboard = () => {
  // 1. Data Fetching
  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('employees/me/').then(res => res.data)
  });

  const { data: attendance } = useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE],
    queryFn: () => api.get('attendance/').then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        return data.slice(0, 5); 
    })
  });

  const { data: loans } = useQuery({
    queryKey: [QUERY_KEYS.LOANS],
    queryFn: () => api.get('loans/').then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        return data.filter(l => l.status === 'approved');
    })
  });

  const { data: payrolls } = useQuery({
    queryKey: [QUERY_KEYS.PAYROLL],
    queryFn: () => api.get('payroll/').then(res => Array.isArray(res.data) ? res.data : res.data.results || [])
  });

  const { data: leaves } = useQuery({
    queryKey: [QUERY_KEYS.LEAVES],
    queryFn: () => api.get('leaves/').then(res => Array.isArray(res.data) ? res.data : res.data.results || [])
  });

  const formattedPay = payrolls?.map(p => ({
    name: p.cutoff_period?.split(' ')[0] || 'N/A', // Shorten
    amount: p.basic_salary - p.sss - p.philhealth - p.pagibig - p.tax - p.loans
  })).reverse() || [];

  const leaveData = [
    { name: 'Vacation', remaining: me?.vacation_leave_balance || 0, color: '#4f46e5' },
    { name: 'Sick', remaining: me?.sick_leave_balance || 0, color: '#ec4899' }
  ];

  if (meLoading) return (
    <div className="p-8 flex justify-center h-[60vh] items-center">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-base-200 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Sparkles size={200} />
        </div>
        <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/5">
              <Sparkles className="w-3 h-3" />
              Good Day, {me?.first_name}!
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-base-content uppercase">
              Welcome Back
            </h1>
            <p className="text-sm font-bold opacity-40 uppercase tracking-widest">
              {me?.position} • {me?.department}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
               <Link to="/attendance" className="btn btn-primary rounded-lg shadow-lg shadow-primary/20 px-8 font-black uppercase tracking-widest text-[11px]">
                  Check In
               </Link>
               <Link to="/leave" className="btn btn-ghost bg-base-100 border-base-200 rounded-lg px-8 font-black uppercase tracking-widest text-[11px] hover:bg-base-200">
                  File Leave
               </Link>
            </div>
          </div>
          
          <div className="hidden md:flex flex-col items-end text-right">
             <div className="flex items-center gap-2 text-xs font-black opacity-30 uppercase tracking-tighter mb-1">
                <MapPin className="w-3 h-3" />
                Work Station
             </div>
             <p className="text-sm font-black text-base-content uppercase tracking-tight max-w-[200px]">
                {me?.school_details?.name || 'Division Office'}
             </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Section: Attendance & Credits */}
        <div className="lg:col-span-2 space-y-8">
           
           {/* Highlights Grid */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-base-200 shadow-sm rounded-xl p-6 flex flex-col justify-between">
                 <p className="text-[10px] font-black uppercase opacity-30 tracking-widest mb-4">Latest Net Pay</p>
                 {payrolls?.length > 0 ? (
                    <div>
                       <h3 className="text-2xl font-black text-primary">
                          ₱{(payrolls[0].basic_salary - payrolls[0].sss - payrolls[0].philhealth - payrolls[0].pagibig - payrolls[0].tax - payrolls[0].loans).toLocaleString()}
                       </h3>
                       <p className="text-[9px] font-bold opacity-40 uppercase mt-1">{payrolls[0].cutoff_period}</p>
                    </div>
                 ) : (
                    <p className="text-[10px] font-bold opacity-20 uppercase">No records yet</p>
                 )}
              </div>

              <div className="bg-white border border-base-200 shadow-sm rounded-xl p-6 flex flex-col justify-between">
                 <p className="text-[10px] font-black uppercase opacity-30 tracking-widest mb-4">Pending Requests</p>
                 <div className="flex gap-4">
                    <div>
                       <h3 className="text-2xl font-black text-warning">
                          {leaves?.filter(l => l.status === 'pending').length || 0}
                       </h3>
                       <p className="text-[9px] font-bold opacity-40 uppercase mt-1">Leaves</p>
                    </div>
                    <div className="border-l border-base-100 pl-4">
                       <h3 className="text-2xl font-black text-accent">
                          {loans?.filter(l => l.status === 'pending').length || 0}
                       </h3>
                       <p className="text-[9px] font-bold opacity-40 uppercase mt-1">Loans</p>
                    </div>
                 </div>
              </div>

              <div className="bg-white border border-base-200 shadow-sm rounded-xl p-6 flex flex-col justify-between">
                 <p className="text-[10px] font-black uppercase opacity-30 tracking-widest mb-4">Next Cutoff</p>
                 <div>
                    <h3 className="text-2xl font-black text-base-content uppercase tracking-tighter">
                       {new Date().getDate() <= 15 ? '16th - End' : '1st - 15th'}
                    </h3>
                    <p className="text-[9px] font-bold opacity-40 uppercase mt-1">Processing period</p>
                 </div>
              </div>
           </div>
           
           {/* Leave Balances */}
           <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                 <CalendarCheck className="w-4 h-4 text-primary opacity-40" />
                 <h2 className="text-[11px] font-black uppercase tracking-widest opacity-40">Leave Credits</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <div className="bg-white border border-base-200 shadow-sm rounded-xl p-6 group hover:border-primary/30 transition-all">
                   <p className="text-[10px] font-black uppercase opacity-30 tracking-widest mb-2">Vacation Credits</p>
                   <div className="flex items-end gap-2 mb-4">
                      <h3 className="text-3xl font-black text-primary">{me?.vacation_leave_balance || 0}</h3>
                      <span className="text-[9px] font-black opacity-20 mb-1 uppercase tracking-tighter">Days</span>
                   </div>
                   <div className="w-full bg-base-100 rounded-full h-1 overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${(me?.vacation_leave_balance / 15) * 100}%` }}></div>
                   </div>
                </div>

                <div className="bg-white border border-base-200 shadow-sm rounded-xl p-6 group hover:border-secondary/30 transition-all">
                   <p className="text-[10px] font-black uppercase opacity-30 tracking-widest mb-2">Sick Credits</p>
                   <div className="flex items-end gap-2 mb-4">
                      <h3 className="text-3xl font-black text-secondary">{me?.sick_leave_balance || 0}</h3>
                      <span className="text-[9px] font-black opacity-20 mb-1 uppercase tracking-tighter">Days</span>
                   </div>
                   <div className="w-full bg-base-100 rounded-full h-1 overflow-hidden">
                      <div className="bg-secondary h-full transition-all duration-1000" style={{ width: `${(me?.sick_leave_balance / 15) * 100}%` }}></div>
                   </div>
                </div>
              </div>
           </div>

           {/* Recent Attendance */}
           <div className="bg-white border border-base-200 shadow-sm rounded-xl overflow-hidden">
              <div className="p-6 border-b border-base-100 flex justify-between items-center">
                 <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Recent Activity</h3>
                 <Link to="/attendance" className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline">
                    View All <ArrowRight className="w-3 h-3" />
                 </Link>
              </div>
              <div className="overflow-x-auto">
                 <table className="table table-sm w-full">
                    <tbody className="divide-y divide-base-50">
                       {attendance?.map(rec => (
                          <tr key={rec.id} className="hover:bg-base-50/50">
                             <td className="px-6 py-4 text-xs font-black text-base-content uppercase">{new Date(rec.date).toLocaleDateString()}</td>
                             <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                   rec.is_geo_flagged 
                                      ? 'bg-error/10 text-error' 
                                      : rec.status === 'present' 
                                         ? 'bg-success/10 text-success' 
                                         : 'bg-warning/10 text-warning'
                                }`}>
                                   {rec.is_geo_flagged ? 'Out' : rec.status}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-right opacity-30 font-bold text-[10px]">{rec.time_in ? rec.time_in.substring(0, 5) : '--:--'}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Personal Analytics Row */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
                 <div className="flex items-center gap-3 mb-8">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Pay History Trend</h3>
                 </div>
                 <div className="h-[200px] w-full">
                    {formattedPay.length > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={formattedPay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                             <defs>
                                <linearGradient id="colorPay" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                   <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                             <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                             <YAxis tick={{ fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                             <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold' }} />
                             <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorPay)" />
                          </AreaChart>
                       </ResponsiveContainer>
                    ) : (
                       <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No pay history</div>
                    )}
                 </div>
              </div>

              <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
                 <div className="flex items-center gap-3 mb-8">
                    <CalendarCheck className="w-4 h-4 text-secondary" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Leave Utilization</h3>
                 </div>
                 <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={leaveData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                          <XAxis type="number" domain={[0, 15]} hide />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} width={60} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold' }} />
                          <Bar dataKey="remaining" radius={[0, 4, 4, 0]} barSize={20}>
                             {leaveData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                             ))}
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
                 <p className="text-[9px] font-bold opacity-30 text-center uppercase mt-4 tracking-tighter">Remaining credits vs 15 days annual cap</p>
              </div>
           </div>
        </div>

        {/* Sidebar: Financials & Quality */}
        <div className="space-y-8">
           <div className="flex items-center gap-2 px-1">
              <Sparkles className="w-4 h-4 text-primary opacity-40" />
              <h2 className="text-[11px] font-black uppercase tracking-widest opacity-40">Highlights</h2>
           </div>

           {/* Loan Card */}
           <div className="bg-white border border-base-200 rounded-xl p-8 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase opacity-30 tracking-widest mb-6">Current Loan</p>
                 {loans?.length > 0 ? (
                    <div className="space-y-6">
                       <h3 className="text-3xl font-black text-base-content">₱{parseFloat(loans[0].loan_amount).toLocaleString()}</h3>
                       <Link to="/loans" className="btn btn-ghost btn-sm bg-base-50 border-base-200 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest">Details</Link>
                    </div>
                 ) : (
                    <div className="space-y-6">
                       <p className="text-xs font-bold opacity-30 leading-relaxed uppercase">No active loans found. Need assistance?</p>
                       <Link to="/loans" className="btn btn-primary btn-sm rounded-lg text-[10px] font-black uppercase tracking-widest px-6 shadow-md shadow-primary/10">Apply</Link>
                    </div>
                 )}
              </div>
              <Wallet className="absolute -right-6 -bottom-6 w-24 h-24 opacity-5 group-hover:scale-110 transition-transform text-primary" />
           </div>

           {/* Performance Card */}
           <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8 hover:border-primary/20 transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-8">
                 <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center border border-primary/5">
                    <Award className="w-5 h-5" />
                 </div>
                 <ChevronRight className="w-4 h-4 opacity-10 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-black text-lg mb-1 text-base-content uppercase tracking-tight">Performance</h3>
              <p className="text-[10px] opacity-40 font-bold mb-8 uppercase leading-relaxed">View your official ratings and promotion eligibility.</p>
              <Link to="/performance" className="text-[10px] font-black text-primary flex items-center gap-2 uppercase tracking-widest">
                 Open Portfolio <ArrowRight className="w-3 h-3" />
              </Link>
           </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeDashboard;
