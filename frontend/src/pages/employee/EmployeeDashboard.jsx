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
    { name: 'Vacation', remaining: me?.vacation_leave_balance || 0, color: 'oklch(48.8% 0.243 264.376)' },
    { name: 'Sick', remaining: me?.sick_leave_balance || 0, color: 'oklch(57.7% 0.245 27.325)' }
  ];

  if (meLoading) return (
    <div className="p-8 flex justify-center h-[60vh] items-center">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-base-200 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Sparkles size={200} />
        </div>
        <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/10">
              <Sparkles className="w-3 h-3 animate-pulse" />
              Service Status: Active
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-base-content uppercase leading-none">
                MABUHAY, <span className="text-primary">{me?.first_name}</span>
              </h1>
              <p className="text-sm font-bold opacity-40 uppercase tracking-[0.2em] ml-1">
                {me?.position} • {me?.department}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
               <Link to="/attendance" className="btn btn-primary rounded-xl shadow-xl shadow-primary/20 px-10 h-14 font-black uppercase tracking-widest text-[11px] group">
                  <Clock className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  Clock In/Out
               </Link>
               <Link to="/leave" className="btn btn-ghost bg-base-100 border-base-200 rounded-xl px-10 h-14 font-black uppercase tracking-widest text-[11px] hover:bg-base-200">
                  Request Leave
               </Link>
            </div>
          </div>
          
          <div className="hidden md:flex flex-col items-end text-right space-y-4">
             <div className="flex items-center gap-2 text-[10px] font-black opacity-30 uppercase tracking-widest">
                <MapPin className="w-3 h-3" />
                {me?.school_details?.name || 'Division Office'}
             </div>
             <div className="bg-base-50 p-6 rounded-2xl border border-base-100 flex items-center gap-6">
                <div className="text-center">
                   <p className="text-[11px] font-bold opacity-60 uppercase mb-1">Leaves</p>
                   <p className="text-xl font-black">{me?.leave_balance || 0}</p>
                </div>
                <div className="w-px h-8 bg-base-200"></div>
                <div className="text-center">
                   <p className="text-[11px] font-bold opacity-60 uppercase mb-1">Step</p>
                   <p className="text-xl font-black">SG {me?.salary_grade?.grade || 'N/A'}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Salary History */}
        <div className="lg:col-span-8 bg-white border border-base-200 shadow-sm rounded-2xl p-8">
           <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-success/10 rounded-lg text-success">
                    <TrendingUp className="w-4 h-4" />
                 </div>
                 <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Net Pay History</h3>
              </div>
              <Link to="/payroll" className="btn btn-ghost btn-xs font-black text-[10px] uppercase opacity-40 hover:opacity-100">
                 View All <ArrowRight className="w-3 h-3" />
              </Link>
           </div>
           <div className="h-[280px] w-full">
              {formattedPay.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedPay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(var(--p))" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="oklch(var(--p))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} tickFormatter={(val) => `₱${(val/1000).toFixed(1)}k`} />
                    <Tooltip 
                      cursor={false}
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold', backgroundColor: 'white' }}
                      formatter={(val) => [`₱${val.toLocaleString()}`, 'Net Pay']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="oklch(var(--p))" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorSalary)" 
                      activeDot={{ r: 6, strokeWidth: 0, fill: 'oklch(var(--p))' }}
                      animationDuration={2000} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-2">
                   <Wallet className="w-10 h-10" />
                   <p className="text-[10px] font-black uppercase tracking-widest">No payroll records yet</p>
                </div>
              )}
           </div>
           <div className="mt-8 p-4 bg-base-50 rounded-xl border border-base-100 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                 Your net salary trend reflects regular semi-monthly disbursements and statutory deductions.
              </p>
           </div>
        </div>

        {/* Leave Credits */}
        <div className="lg:col-span-4 bg-white border border-base-200 shadow-sm rounded-2xl p-8 flex flex-col">
           <div className="flex items-center gap-3 mb-10">
              <div className="p-2 bg-accent/10 rounded-lg text-accent">
                 <CalendarCheck className="w-4 h-4" />
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Leave Credits</h3>
           </div>
           
           <div className="flex-1 space-y-8">
              {leaveData.map((item, index) => (
                <div key={index} className="space-y-4">
                   <div className="flex justify-between items-end">
                      <p className="text-xs font-black uppercase tracking-widest">{item.name} Leave</p>
                      <p className="text-2xl font-black">{item.remaining}<span className="text-[10px] opacity-30 ml-1">DAYS</span></p>
                   </div>
                   <div className="h-4 w-full bg-base-100 rounded-full overflow-hidden p-1">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${Math.min((item.remaining / 15) * 100, 100)}%`,
                          backgroundColor: item.color 
                        }}
                      />
                   </div>
                </div>
              ))}
           </div>

           <div className="mt-12 space-y-3">
              <div className="p-4 bg-accent/5 rounded-xl border border-accent/10 text-center">
                 <p className="text-[9px] font-black opacity-40 uppercase mb-1">Total Available</p>
                 <p className="text-2xl font-black text-accent">{me?.leave_balance || 0} Credits</p>
              </div>
              <p className="text-[9px] font-bold text-center opacity-30 uppercase tracking-widest leading-loose">
                 Based on the latest Civil Service Commission standardized balances.
              </p>
           </div>
        </div>

        {/* Quick Summary Section */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-white p-8 rounded-2xl border border-base-200 shadow-sm flex items-center gap-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                 <Award className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-1">Service Rank</p>
                 <p className="text-sm font-bold truncate">{me?.position || 'Personnel'}</p>
              </div>
           </div>
           <div className="bg-white p-8 rounded-2xl border border-base-200 shadow-sm flex items-center gap-6">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary shrink-0">
                 <MapPin className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-1">Primary School</p>
                 <p className="text-sm font-bold truncate">{me?.school_details?.name || 'Division Office'}</p>
              </div>
           </div>
           <div className="bg-white p-8 rounded-2xl border border-base-200 shadow-sm flex items-center gap-6">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent shrink-0">
                 <Clock className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-1">Work Shift</p>
                 <p className="text-sm font-bold truncate">Standard 8:00 - 5:00</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
