import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { Wallet, FileText, AlertCircle, TrendingUp, HandCoins, Calendar, BarChart3, PieChart as PieChartIcon, ShieldCheck } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
        <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Payroll Disbursed</p>
              <h2 className="text-2xl font-black text-base-content">₱{stats?.total_payroll_disbursed || '0.00'}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-secondary/5 rounded-lg flex items-center justify-center text-secondary">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Total Loans Paid</p>
              <h2 className="text-2xl font-black text-base-content">₱{stats?.total_loan_portfolio || '0.00'}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-warning/5 rounded-lg flex items-center justify-center text-warning">
              <HandCoins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Approved Loans</p>
              <h2 className="text-2xl font-black text-base-content">{stats?.approved_loan_count || 0}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-accent/5 rounded-lg flex items-center justify-center text-accent">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Payroll Ready</p>
              <h2 className="text-2xl font-black text-base-content">{stats?.ready_for_release || 0}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-base-200 shadow-sm rounded-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Payroll Disbursement Trend</h3>
          </div>
          <div className="h-[300px] w-full">
            {formattedPayroll.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedPayroll} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} tickFormatter={(val) => `₱${(val/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No payroll history available</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <PieChartIcon className="w-4 h-4 text-secondary" />
            <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Loan Portfolio Mix</h3>
          </div>
          <div className="h-[250px] w-full">
            {formattedLoans.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formattedLoans}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {formattedLoans.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">No loan data</div>
            )}
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-6">
            {formattedLoans.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-tight opacity-60">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;
