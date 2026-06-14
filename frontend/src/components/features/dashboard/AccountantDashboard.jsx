import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { Wallet, FileText, AlertCircle, TrendingUp, HandCoins, Calendar, BarChart3, PieChart as PieChartIcon, ShieldCheck } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['oklch(48.8% 0.243 264.376)', 'oklch(90.5% 0.182 98.111)', 'oklch(57.7% 0.245 27.325)', '#10b981', '#8b5cf6'];

const AccountantDashboard = ({ stats }) => {
  const { data: payrollData } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.PAYROLL],
    queryFn: () => api.get('analytics/payroll/').then(res => res.data)
  });

  const { data: loanData } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.LOAN_STATUS],
    queryFn: () => api.get('analytics/loans/').then(res => res.data)
  });

  const formattedPayroll = payrollData?.map(item => ({
    name: item.cutoff_period,
    amount: parseFloat(item.total_net)
  })).reverse() || [];

  const formattedLoans = loanData?.map(item => ({
    name: item.status?.toUpperCase() || 'UNKNOWN',
    value: item.count
  })) || [];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border-l-4 border-l-primary shadow-md rounded-xl p-8 transition-all hover:shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Total Disbursed</p>
              <h2 className="text-2xl font-black text-base-content tracking-tighter">₱{stats?.total_payroll_disbursed || '0.00'}</h2>
            </div>
          </div>
          <div className="badge badge-primary badge-outline font-black text-[9px] px-3 uppercase">Net Payroll</div>
        </div>

        <div className="bg-white border-l-4 border-l-secondary shadow-md rounded-xl p-8 transition-all hover:shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-secondary/5 rounded-lg flex items-center justify-center text-secondary">
              <HandCoins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Loan Portfolio</p>
              <h2 className="text-2xl font-black text-base-content tracking-tighter">₱{stats?.total_loan_portfolio || '0.00'}</h2>
            </div>
          </div>
          <div className="badge badge-secondary badge-outline font-black text-[9px] px-3 uppercase">Released Capital</div>
        </div>

        <div className="bg-white border-l-4 border-l-warning shadow-md rounded-xl p-8 transition-all hover:shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-warning/5 rounded-lg flex items-center justify-center text-warning">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Approved Loans</p>
              <h2 className="text-2xl font-black text-base-content">{stats?.approved_loan_count || 0}</h2>
            </div>
          </div>
          <div className="text-[10px] font-bold text-warning uppercase tracking-widest flex items-center gap-1 mt-1">
             <AlertCircle className="w-3 h-3" /> Ready for Funds
          </div>
        </div>

        <div className="bg-white border-l-4 border-l-accent shadow-md rounded-xl p-8 transition-all hover:shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-accent/5 rounded-lg flex items-center justify-center text-accent">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Payroll Ready</p>
              <h2 className="text-2xl font-black text-base-content">{stats?.ready_for_release || 0}</h2>
            </div>
          </div>
          <div className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1 mt-1">
             <FileText className="w-3 h-3" /> Approved Cycles
          </div>
        </div>
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-base-200 shadow-sm rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <BarChart3 className="w-4 h-4 text-primary" />
               <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Payroll Trends</h3>
            </div>
            <div className="text-[10px] font-bold opacity-30 uppercase tracking-widest">Last 6 Cutoffs</div>
          </div>
          <div className="h-[320px] w-full">
            {formattedPayroll.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedPayroll} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(48.8% 0.243 264.376)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="oklch(48.8% 0.243 264.376)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} tickFormatter={(val) => `₱${(val/1000).toFixed(0)}k`} />
                  <Tooltip 
                    cursor={false}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold', backgroundColor: 'white' }}
                    formatter={(val) => [`₱${val.toLocaleString()}`, 'Net Amount']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="oklch(48.8% 0.243 264.376)" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorAmt)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: 'oklch(48.8% 0.243 264.376)' }}
                    animationDuration={2000} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-2">
                 <Wallet className="w-12 h-12" />
                 <p className="text-[10px] font-black uppercase tracking-widest">No payroll history available</p>
              </div>
            )}
          </div>
          <div className="mt-6 flex items-center gap-3 text-[10px] font-bold opacity-50 bg-base-50 p-4 rounded-xl border border-base-100">
             <AlertCircle className="w-4 h-4 text-primary" />
             Financial trend shows semi-monthly disbursement volume based on released payroll.
          </div>
        </div>

        <div className="bg-white border border-base-200 shadow-sm rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <PieChartIcon className="w-4 h-4 text-secondary" />
            <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Portfolio Mix</h3>
          </div>
          <div className="h-[280px] w-full relative">
            {formattedLoans.length > 0 ? (
              <>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-[10px] font-black opacity-30 uppercase">TOTAL</span>
                   <span className="text-3xl font-black">
                      {formattedLoans.reduce((acc, curr) => acc + curr.value, 0)}
                   </span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formattedLoans}
                      innerRadius={75}
                      outerRadius={100}
                      paddingAngle={10}
                      dataKey="value"
                    >
                      {formattedLoans.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No loan data</div>
            )}
          </div>
          <div className="space-y-3 mt-6">
            {formattedLoans.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-base-50 rounded-lg border border-base-100">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }}></div>
                   <span className="text-[11px] font-bold opacity-70 uppercase tracking-wide">{item.name}</span>
                </div>
                <span className="text-xs font-black text-base-content">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;
